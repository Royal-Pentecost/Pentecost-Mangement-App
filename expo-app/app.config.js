// google-services.json is kept out of git, so EAS cloud builds receive it as a
// secret file variable (GOOGLE_SERVICES_JSON); local builds use the file here.
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? config.android.googleServicesFile,
  },
});
