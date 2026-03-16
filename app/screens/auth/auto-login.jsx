import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { apiUrl } from '../../constant/constants';

export default function AutoLogin() {
  const router = useRouter();
  const { bootstrap_token: bootstrapToken } = useLocalSearchParams();
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    const run = async () => {
      if (Platform.OS !== 'web') {
        if (isActive) {
          setError('This login shortcut only supports the web app.');
        }
        return;
      }

      if (!bootstrapToken) {
        if (isActive) {
          setError('Missing login token.');
        }
        return;
      }

      try {
        const response = await axios.post(`${apiUrl}web-auto-login`, {
          bootstrap_token: String(bootstrapToken),
        });

        const payload = response.data;
        if (!payload?.token || !payload?.data) {
          throw new Error('Invalid login response.');
        }

        await AsyncStorage.setItem('authToken', payload.token);
        await AsyncStorage.setItem('customerData', JSON.stringify(payload.data));
        await AsyncStorage.setItem('lastActiveTime', String(Date.now()));

        router.replace('/(tabs)');
      } catch (loginError) {
        if (isActive) {
          setError(
            loginError?.response?.data?.messages?.error ||
            loginError?.response?.data?.message ||
            loginError?.message ||
            'Unable to login automatically.'
          );
        }
      }
    };

    run();

    return () => {
      isActive = false;
    };
  }, [bootstrapToken, router]);

  return (
    <View style={styles.container}>
      {!error ? (
        <>
          <ActivityIndicator size="large" color="#C2000E" />
          <Text style={styles.title}>Signing you in...</Text>
          <Text style={styles.subtitle}>Please wait while we open your customer session.</Text>
        </>
      ) : (
        <>
          <Text style={styles.errorTitle}>Auto-login failed</Text>
          <Text style={styles.subtitle}>{error}</Text>
          <TouchableOpacity style={styles.button} onPress={() => router.replace('/screens/auth/login')}>
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#F7E5CF',
  },
  title: {
    marginTop: 16,
    fontSize: 24,
    color: '#231815',
    fontFamily: 'Route159-Bold',
  },
  errorTitle: {
    fontSize: 24,
    color: '#9F0712',
    fontFamily: 'Route159-Bold',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 22,
    color: '#4B3026',
    fontFamily: 'Route159-Regular',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#C2000E',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Route159-Bold',
  },
});
