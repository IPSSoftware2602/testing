import 'react-native-get-random-values';
import { Redirect } from 'expo-router';
import { Platform } from 'react-native';
import { getQrCodeForHost } from '../constants/hostQrMap';

export default function Index() {
  // CR-018: on web, check if the current hostname is a white-labelled QR
  // subdomain (e.g. `regaliatest.cocacola.my`). If so, route straight to that
  // QR's menu instead of the generic splash. Mapping lives in
  // `constants/hostQrMap.js` — add new subdomains there.
  //
  // Native (iOS / Android) apps have no hostname so this branch is skipped.
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    const qrCode = getQrCodeForHost(window.location.hostname);
    if (qrCode) {
      return <Redirect href={`/qr/${qrCode}`} />;
    }
  }

  return <Redirect href="/screens/splash" />;
}
