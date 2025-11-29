import messaging from '@react-native-firebase/messaging';

export async function registerPushToken() {
  // if (!Device.isDevice) return null;

  // Request notification permissions
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log("Permission not granted");
    return null;
  }

  // === iOS & Android firebase token ===
  const fcmToken = await messaging().getToken();

  return { type: "fcm", token: fcmToken };
}
