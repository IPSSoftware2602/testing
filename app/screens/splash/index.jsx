import { useLocalSearchParams, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import useAuthGuard from '../../auth/check_token_expiry';
import {
  requestLatestLocation,
  STARTUP_LOCATION_TOAST_KEY,
} from '../../../utils/location_bootstrap';
// Removed useAuthGuard import - splash screen allows access without login (App Store requirement)

const { width, height } = Dimensions.get('window');

// keep the native splash up until we hide it below
SplashScreen.preventAutoHideAsync();

export default function Splash() {
  // Removed useAuthGuard - splash screen allows access without login (App Store requirement)
  useAuthGuard();
  const router = useRouter();
  const { referral_id } = useLocalSearchParams();
  const [countdown, setCountdown] = useState(8);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    const checkStoredData = async () => {
      let countdownTimer = null;
      let timeoutTimer = null;

      const finishBoot = async ({ failed = false } = {}) => {
        if (hasNavigatedRef.current) return;
        hasNavigatedRef.current = true;

        if (countdownTimer) clearInterval(countdownTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);

        if (failed) {
          await AsyncStorage.setItem(STARTUP_LOCATION_TOAST_KEY, 'Failed to get your current location');
        } else {
          await AsyncStorage.removeItem(STARTUP_LOCATION_TOAST_KEY);
        }

        await SplashScreen.hideAsync();
        router.replace('(tabs)');
      };

      try {
        if (referral_id) {
          await AsyncStorage.setItem('referralId', referral_id);
        }

        countdownTimer = setInterval(() => {
          setCountdown(prev => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        timeoutTimer = setTimeout(() => {
          finishBoot({ failed: true });
        }, 8000);

        await requestLatestLocation({ timeoutMs: 7500 });
        await finishBoot();

      } catch (err) {
        console.log('Startup location bootstrap failed:', err?.message || err);
      }

      return () => {
        if (countdownTimer) clearInterval(countdownTimer);
        if (timeoutTimer) clearTimeout(timeoutTimer);
      };
    };

    let cleanup;
    checkStoredData().then(result => {
      cleanup = result;
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [referral_id, router]);

  return (
    <ResponsiveBackground>
      <View style={styles.container}>
        <View style={styles.topSection}>
          <Text style={styles.hello}>{`HELLO USPIZZA LOVERS,\nWELCOME TO`}</Text>
          <Image source={require('../../../assets/images/uspizza-splash.png')} style={styles.logoSplash} resizeMode="contain" />
          <Text style={styles.professionals}>THE PIZZA PROFESSIONALS</Text>
        </View>
        <View style={styles.middleSection}>
          <Image source={require('../../../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.loadingTitle}>Getting your latest location...</Text>
          <Text style={styles.loadingSubtitle}>
            Entering the app in {countdown}s if location is still unavailable
          </Text>
        </View>
        <View style={styles.bottomSection}>
          <Image source={require('../../../assets/images/www_uspizza.png')} style={styles.logoFooter} resizeMode="contain" />
          <Text style={styles.story}>
            {`US PIZZA'S STORY BEGINS IN 1997 WITH ITS FIRST HUMBLE OUTLET. FOUNDED BY MR. DONALD DUNCAN, AN AMERICAN,
          THE RESTAURANT WAS INITIALLY KNOWN AS DUNCAN PIZZA RESTAURANT, WHICH WAS LATER RENAMED AS US PIZZA FOLLOWING ITS ORIGIN.
          THE AMERICAN FOUNDER ALSO CREATED HIS OWN RECIPE OF DOUGH AND TOMATO SAUCE THE SIGNATURE, "DUNCAN SAUCE"`}
          </Text>
        </View>
      </View>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E1',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 40,
    width: Math.min(width, 440),
    alignSelf: 'center'
  },
  topSection: {
    alignItems: 'center',
    marginTop: 80,
  },
  hello: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 25,
    textAlign: 'center',
    fontFamily: 'Route159-Heavy',
    marginBottom: 0,
  },
  professionals: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 0,
    marginTop: -20,
    fontFamily: 'Route159-Heavy'
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height * 0.25,
  },
  logo: {
    width: 180,
    height: 120,
    alignSelf: 'center',
    marginVertical: 10,
  },
  loadingTitle: {
    color: '#E60012',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Route159-Heavy',
    marginTop: 12,
  },
  loadingSubtitle: {
    color: '#A31B1B',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Route159-Regular',
    marginTop: 8,
    paddingHorizontal: 18,
    lineHeight: 18,
  },
  bottomSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  website: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  story: {
    color: '#E60012',
    fontSize: 7,
    textAlign: 'center',
    marginHorizontal: 14,
    marginBottom: 10,
    marginTop: -20,
    fontFamily: 'Frick-Regular',
    lineHeight: 8,
    letterSpacing: -0.5,
  },
  logoSplash: {
    width: 350,
    margin: 0,
    padding: 0,
    alignSelf: 'center',
    marginTop: -20,
  },
  logoFooter: {
    width: 100,
    alignSelf: 'center',
  },
});
