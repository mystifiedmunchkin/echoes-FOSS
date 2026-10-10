# ECHOES

ECHOES is an Expo SDK 57 / React Native 0.86 AR memory application.

## Native module migration

The application entry point is `index.js`; it registers `app/App.js` directly rather
than using Expo Router. Native replacements are used for camera access, media capture
and resizing, audio recording and playback, video, files, locale detection, and
geolocation. The Android launch screen remains the native drawable configured in
`android/app/src/main/res`.

These modules require a development or release build. They are not available in Expo
Go. Keep the camera, microphone, and location usage descriptions and Android
permissions in `app.json` synchronized with native project regeneration.
