module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo auto-configures the reanimated/worklets plugin on SDK 54
    presets: ['babel-preset-expo'],
  };
};
