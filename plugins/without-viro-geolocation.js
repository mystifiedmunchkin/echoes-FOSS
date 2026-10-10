const { withAppBuildGradle } = require('expo/config-plugins');

module.exports = function withoutViroGeolocation(config) {
  return withAppBuildGradle(config, (currentConfig) => {
    currentConfig.modResults.contents = currentConfig.modResults.contents
      .replace(/\s*\/\/ Required for ARCore Geospatial API\s*/g, '\n')
      .replace(/\s*implementation ['"]com\.google\.android\.gms:play-services-location:[^'"]+['"]\s*/g, '\n');
    return currentConfig;
  });
};
