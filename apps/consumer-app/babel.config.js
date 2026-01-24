module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // Required for reanimated to work
            'react-native-reanimated/plugin',
        ],
    };
};
