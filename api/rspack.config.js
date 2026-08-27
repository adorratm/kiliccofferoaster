const path = require('path');
const nodeExternals = require('webpack-node-externals');

const rootNodeModules = path.resolve(__dirname, '../node_modules');

/**
 * Nest rspack: main + migrate entry (one-shot DB migrations in prod deploy).
 * Yarn hoists deps to the workspace root, so externals must scan that
 * node_modules. @nestjs/typeorm v12 is ESM-only (no "require" export), so it
 * is allowlisted and bundled; rspack resolves it via the "import" condition.
 * @param {import('@rspack/core').Configuration} options
 */
module.exports = function (options) {
  const mainEntry =
    typeof options.entry === 'string'
      ? options.entry
      : options.entry?.main || './src/main.ts';

  return {
    ...options,
    entry: {
      main: mainEntry,
      migrate: './src/migrate.ts',
    },
    output: {
      ...options.output,
      filename: '[name].js',
    },
    optimization: {
      ...options.optimization,
      concatenateModules: false,
    },
    resolve: {
      ...options.resolve,
      alias: {
        ...options.resolve?.alias,
        '@nestjs/typeorm': path.join(
          rootNodeModules,
          '@nestjs/typeorm/dist/index.js',
        ),
      },
      conditionNames: [
        'import',
        'require',
        'node',
        'default',
        'module',
        ...(options.resolve?.conditionNames ?? []),
      ],
    },
    externals: [
      nodeExternals({
        allowlist: [
          /^webpack\/hot/,
          /^@rspack\/core\/hot/,
          /^@nestjs\/typeorm($|\/)/,
        ],
        modulesDir: rootNodeModules,
        additionalModuleDirs: [path.resolve(__dirname, 'node_modules')],
      }),
    ],
  };
};
