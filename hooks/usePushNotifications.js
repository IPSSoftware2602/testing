import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';

export async function registerPushToken() {
  // Android 13+ (API 33) requires explicit POST_NOTIFICATIONS permission
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      console.log("Android notification permission not granted");
      return null;
    }
  }

  // iOS permission dialog + Android < 13 (auto-granted)
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log("Permission not granted");
    return null;
  }

  const fcmToken = await messaging().getToken();

  return { type: "fcm", token: fcmToken };
}
