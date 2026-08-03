/* global module */
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Required for reanimated to work - MUST BE LAST
      'react-native-reanimated/plugin',
    ],
  };
};
