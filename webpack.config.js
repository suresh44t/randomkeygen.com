/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
const CopyWebpackPlugin = require('copy-webpack-plugin');
const OpenBrowserPlugin = require('open-browser-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const SplitByPathPlugin = require('webpack-split-by-path');
const BabiliPlugin = require('babili-webpack-plugin');
const path = require('path');
const { argv } = require('optimist');

const { NODE_ENV } = process.env;
const entry = {
    app: []
};

const plugins = [
    new HtmlWebpackPlugin({
        template: 'index.html',
        chunksSortMode: (a, b) => {
            const order = ['manifest', 'vendor', 'app'];
            const nameA = a.names[0];
            const nameB = b.names[0];

            return order.indexOf(nameA) - order.indexOf(nameB);
        }
    }),
    new SplitByPathPlugin([{
        name: 'vendor',
        path: path.join(__dirname, 'node_modules/'),
    }]),
    function saveChunksPlugin() {
        this.plugin('emit', (compilation, callback) => {
            const chunks = [];
            for (const { files: [jsName] } of compilation.chunks) {
                chunks.push(jsName);
            }
            const chunksJSON = JSON.stringify(chunks);
            // eslint-disable-next-line no-param-reassign
            compilation.assets['chunks.json'] = {
                source: () => chunksJSON,
                size: () => chunksJSON.length
            };
            callback();
        });
    }
];

if (NODE_ENV === 'development') {
    const { port } = argv;

    entry.app.push(`webpack-dev-server/client?http://localhost:${port}`);
    plugins.push(new OpenBrowserPlugin({
        url: `http://localhost:${port}`,
        ignoreErrors: true
    }));
}

if (NODE_ENV === 'production') {
    plugins.push(new BabiliPlugin());
}

let filename;
let chunkFilename;

if (NODE_ENV === 'development') {
    filename = 'js/[name].js';
    chunkFilename = 'js/[id].[name].chunk.js';
} else {
    filename = 'js/[name]-[chunkhash].js';
    chunkFilename = 'js/[id]-[chunkhash].[name].chunk.js';
}

entry.app.push(
    'babel-polyfill',
    './js/index'
);

plugins.push(new CopyWebpackPlugin([
    { from: 'static', to: '.' },
]));

module.exports = {
    entry,
    plugins,
    context: __dirname,
    output: {
        filename,
        chunkFilename,
        path: path.resolve('dist/'),
        library: 'app',
        libraryTarget: 'var'
    },
    module: {
        rules: [{
            test: /.js?$/,
            use: ['babel-loader'],
            include: path.resolve('js/')
        }]
    },
    devtool: 'source-map'
};
