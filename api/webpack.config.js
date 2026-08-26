/**
 * Nest webpack: main + migrate entry (one-shot DB migrations in prod deploy).
 * @param {import('webpack').Configuration} options
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
  };
};
