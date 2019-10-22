const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

const SRC_PATH = path.resolve(__dirname, 'src');
const BUILD_PATH = path.resolve(__dirname, 'public', 'build');

const config = {
    entry: path.join(SRC_PATH, 'index.js'),
    output: {
        path: BUILD_PATH,
        filename: '[name].[contenthash].js',
        publicPath: '/build/',
    },
    plugins: [
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.join(SRC_PATH, 'index.html'),
            favicon: path.join(SRC_PATH, 'assets', 'icons', 'favicon.ico'),
            minify: {
                collapseWhitespace: true,
                removeComments: true,
                removeRedundantAttributes: true,
                removeScriptTypeAttributes: true,
                removeStyleLinkTypeAttributes: true,
                useShortDoctype: true,
            },
        }),
    ],
    optimization: {
        minimize: true,
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\\/]node_modules[\\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.(png|jpg|gif|mp4|woff|woff2|ico)$/,
                use: [
                    {
                        loader: 'file-loader',
                    },
                ],
            },
            {
                test: /\.js$/,
                use: 'babel-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.scss$/,
                use: [
                    'style-loader',
                    'css-loader',
                    'sass-loader',
                ],
            },
        ],
    },
    devServer: {
        contentBase: BUILD_PATH,
        writeToDisk: true,
        open: false,
    },
};

module.exports = (env, argv) => {
    if (argv.hot) {
        // contenthash isn't available when hot reloading.
        config.output.filename = '[name].[hash].js';
    }

    return config;
};
