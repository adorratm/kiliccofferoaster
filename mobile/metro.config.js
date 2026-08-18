const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/** Metro + tslib package exports `modules/index.js` kırıyor (echarts / zrender). */
const tslibEs6 = require.resolve('tslib/tslib.es6.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === 'tslib' ||
    moduleName === 'tslib/modules/index.js' ||
    moduleName.endsWith('/tslib/modules/index.js')
  ) {
    return { filePath: tslibEs6, type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
