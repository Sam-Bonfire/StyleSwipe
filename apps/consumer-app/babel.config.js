/* global module */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Fix for @xenova/transformers or libraries using import.meta
      'transform-import-meta',
      // Required for reanimated to work - MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
};
