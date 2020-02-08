const path = require("path");
module.exports = {
  entry: path.resolve(__dirname, "../src/index.ts"),
  output: {
    path: path.resolve(__dirname, "../dist"),
    filename: "myvuex.js",
    libraryTarget: "umd"
  },
  module: {
    rules: [
      {
        test: /\.js$/i,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env"]
          }
        }
      },
      {
        test: /\.ts$/i,
        use: "ts-loader",
        exclude: /node_modules/
      },
    ],
  }
};
