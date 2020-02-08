const { CleanWebpackPlugin } = require("clean-webpack-plugin");
module.exports = {
  plugins: [
    new CleanWebpackPlugin() // 构建成功后清空dist目录
  ]
};
