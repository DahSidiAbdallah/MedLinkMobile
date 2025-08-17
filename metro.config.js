// metro.config.js
const { getDefaultConfig } = require('@expo/metro-config');
const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  'react-native-linear-gradient': 'react-native-web-linear-gradient',
};

module.exports = config;
