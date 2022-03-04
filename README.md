# @hanakla/worker-thread-loader

webpack loader multi threader powered by `worker_thread`.

```
yarn add -D @hanakla/worker-thread-loader
```



```js
// webpack.config.js
module: {
  rules: [
    {
      test: /\.[jt]sx?/,
      use: [
        // insert this loader in top of all loaders
        {
          loader: "@hanakla/worker-thread-loader",
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
```
