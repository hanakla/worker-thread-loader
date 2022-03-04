import * as loaderUtils from "loader-utils";
import { nanoid } from "nanoid";
import { LoaderContext } from "webpack";
import { Worker } from "worker_threads";
import type { Message, WorkerResponse } from "./worker";

let workers: Worker[] | null = null;
let nextWorkerIdx = 0;

const rq = Object.create(null);

export function pitch(this: LoaderContext<{ maxWorkers: number }>) {
  const { maxWorkers } = this.getOptions
    ? this.getOptions()
    : loaderUtils.getOptions(this as any);
  const taskId = nanoid();

  workers ??= Array.from({ length: +(maxWorkers ?? 2) }).map(() => {
    const w = new Worker(require.resolve("./worker"));
    w.unref();
    return w;
  });

  const callback = this.async();

  const worker = workers[nextWorkerIdx];
  nextWorkerIdx = (nextWorkerIdx + 1) % workers.length;

  worker.postMessage({
    type: "request",
    id: taskId,
    options: {
      loaders: this.loaders.slice(this.loaderIndex + 1).map((l) => ({
        loader: l.path,
        options: l.options,
        ident: l.ident,
      })),
      context: {
        sourceMap: this.sourceMap,
        rootContext: this.rootContext,
      },
      resource: this.resourcePath + (this.resourceQuery ?? ""),
    },
  } as Message);

  rq[taskId] = false;

  const resultReceiver = (message: WorkerResponse) => {
    if (message.taskId !== taskId) return;

    rq[taskId] = true;

    if (message.type === "error") {
      callback!(message.err);
      worker.off("message", resultReceiver);
    } else {
      callback!(null, ...message.result);
      worker.off("message", resultReceiver);
    }
  };

  worker.on("message", resultReceiver);
}
