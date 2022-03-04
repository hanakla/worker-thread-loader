import { join } from "path";
import { Configuration } from "webpack";

export default (): Configuration => {
  return {
    mode: "production",
    target: "web",
    entry: [join(__dirname, "src/index.tsx")],
    resolve: {
      extensions: [".js", ".ts", ".tsx"],
    },
    module: {
      rules: [
        {
          test: /\.[jt]sx?/,
          use: [
            {
              loader: require.resolve("worker-thread-loader"),
              options: {
                maxWorkers: 16,
              },
            },
            {
              loader: "esbuild-loader",
              options: { loader: "tsx", target: "es2015" },
            },
          ],
        },
      ],
    },
  };
};
