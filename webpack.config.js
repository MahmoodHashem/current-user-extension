const path = require('path');

/** @type {import('webpack').Configuration} */
module.exports = {
  entry: {
    content: './src/content.ts',
    popup:   './src/popup/popup.ts',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // No eval() — required for MV3 CSP
  devtool: false,
};
