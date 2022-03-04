import fs from "fs";
import { RunLoaderOption, RunLoaderResult, runLoaders } from "loader-runner";
import { nanoid } from "nanoid";
import { parentPort } from "worker_threads";

export type Message = {
  type: "request";
  id: string;
  options: RunLoaderOption & {
    context: {
      minimize: boolean;
      sourceMap: boolean;
      rootContext: string;
    };
  };
};

export type WorkerResponse =
  | {
      taskId: string;
      type: "error";
      err: NodeJS.ErrnoException | null;
    }
  | {
      taskId: string;
      type: "ok";
      result: Buffer[];
      deps: {
        fileDependencies: string[];
        contextDependencies: string[];
        missingDependencies: string[];
        buildDependencies: string[];
      };
    };

const workerId = nanoid(4);

parentPort!.on("message", (message: Message) => {
  switch (message.type) {
    case "request": {
      console.log(
        `worker: ${workerId} receive request ${message.options.context}`
      );

      const { id, options } = message;
      const buildDependencies: string[] = [];

      runLoaders(
        {
          ...options,
          readResource: fs.readFile.bind(fs),
          context: {
            ...options.context,
            options: {
              context: options.context.rootContext,
            },
            fs,
            webpack: true,
            addBuildDependency(name: string) {
              buildDependencies.push(name);
            },
          },
        },
        (err, result: RunLoaderResult) => {
          if (err) {
            parentPort!.postMessage({
              taskId: id,
              type: "error",
              err,
            } as WorkerResponse);
            return;
          }
          parentPort!.postMessage({
            taskId: id,
            type: "ok",
            result: result.result,
            deps: {
              fileDependencies: result.fileDependencies,
              contextDependencies: result.contextDependencies,
              missingDependencies: ((result as any).missingDependencies ??
                []) as string[],
              buildDependencies,
            },
          } as WorkerResponse);
        }
      );

      break;
    }
  }
});
