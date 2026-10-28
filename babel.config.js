module.exports = function(api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54) already includes class-properties/private-methods
    // transforms and the Reanimated/worklets plugin.
    presets: ['babel-preset-expo'],
  };
};
