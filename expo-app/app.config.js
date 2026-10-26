// google-services.json is kept out of git, so EAS cloud builds receive it as a
// secret file variable (GOOGLE_SERVICES_JSON); local builds use the file here.
//
// The Google Maps key is a secret too — this repository is public — so it
// comes from the GOOGLE_MAPS_API_KEY environment variable (an EAS secret for
// cloud builds). Without it the attendance screen falls back to the stylised
// map rather than showing a blank Google one.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
  plugins: [
    ...config.plugins,
    ["react-native-maps", { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY ?? "" }],
  ],
  extra: {
    ...config.extra,
    // Read by AttendanceMap to decide whether a Google map can be shown.
    googleMapsConfigured: Boolean(process.env.GOOGLE_MAPS_API_KEY),
  },
});
