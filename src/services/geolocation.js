import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

export async function requestForegroundPermissionsAsync() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return {
      status: result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied',
      granted: result === PermissionsAndroid.RESULTS.GRANTED,
      canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
    };
  }

  const status = await Geolocation.requestAuthorization('whenInUse');
  return {
    status: status === 'granted' ? 'granted' : 'denied',
    granted: status === 'granted',
    canAskAgain: status === 'disabled' || status === 'denied',
  };
}

export function getCurrentPositionAsync(options = {}) {
  return new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 10000,
    });
  });
}
