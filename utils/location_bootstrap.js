import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CURRENT_LOCATION_STORAGE_KEY = 'currentLocation';
export const STARTUP_LOCATION_TOAST_KEY = 'startupLocationToast';

function timeoutAfter(timeoutMs) {
  return new Promise((_, reject) => {
    const timerId = setTimeout(() => {
      clearTimeout(timerId);
      reject(new Error('LOCATION_TIMEOUT'));
    }, timeoutMs);
  });
}

export async function storeCurrentLocation(coords) {
  if (coords?.lat == null || coords?.lng == null) return;

  await AsyncStorage.setItem(
    CURRENT_LOCATION_STORAGE_KEY,
    JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      updatedAt: Date.now(),
    })
  );
}

export async function getStoredCurrentLocation() {
  const stored = await AsyncStorage.getItem(CURRENT_LOCATION_STORAGE_KEY);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored);
    if (parsed?.lat == null || parsed?.lng == null) return null;
    return {
      lat: parseFloat(parsed.lat),
      lng: parseFloat(parsed.lng),
      updatedAt: parsed.updatedAt || null,
    };
  } catch (_error) {
    return null;
  }
}

export async function requestLatestLocation({ timeoutMs = 8000 } = {}) {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted') {
    throw new Error('LOCATION_PERMISSION_DENIED');
  }

  const currentPosition = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
    timeoutAfter(timeoutMs),
  ]);

  const latitude = currentPosition?.coords?.latitude;
  const longitude = currentPosition?.coords?.longitude;

  if (latitude == null || longitude == null) {
    throw new Error('LOCATION_UNAVAILABLE');
  }

  const coords = {
    lat: latitude,
    lng: longitude,
  };

  await storeCurrentLocation(coords);

  return coords;
}
