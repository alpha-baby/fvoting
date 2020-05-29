const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
  mode: 'development',
  entry: {
    FVoting: "./src/FVoting.js"
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.(png|svg|jpg|gif)$/,
        use: [
          'file-loader',
          'url-loader'
        ]
      },
      {
        test: /\.(ttf|eot|svg|woff|woff2|otf)$/,
        use: [
          'file-loader',
          'url-loader'
        ]
      }
    ],

  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin(
      [
        { from: "./src/FVoting.html", to: "FVoting.html" }
      ]
    ),
  ],
  devServer: {
    disableHostCheck: true,
    contentBase: path.join(__dirname, "dist"),
    compress: true,
    hot: true,
    port: 3000,
    open: false,
  },
};
