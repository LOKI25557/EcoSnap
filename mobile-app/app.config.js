module.exports = ({ config }) => {
  return {
    ...config,
    ios: {
      ...config.ios,
      bundleIdentifier: "com.pravee.ecosnap",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
      }
    },
    android: {
      ...config.android,
      package: "com.pravee.ecosnap",
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""
        }
      }
    }
  };
};
