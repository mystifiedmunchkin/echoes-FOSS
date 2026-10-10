import { Platform, PermissionsAndroid } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

const NativeGeolocation = requireNativeModule('EchoesGeolocation');

const granted = 'granted';
const denied = 'denied';

export async function requestForegroundPermissionsAsync() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return {
      status: result === PermissionsAndroid.RESULTS.GRANTED ? granted : denied,
      canAskAgain: result !== PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN,
      granted: result === PermissionsAndroid.RESULTS.GRANTED,
    };
  }

  return NativeGeolocation.requestForegroundPermissionsAsync();
}

export async function getCurrentPositionAsync(options = {}) {
  return NativeGeolocation.getCurrentPositionAsync({
    timeout: options.timeout ?? 10000,
  });
}
