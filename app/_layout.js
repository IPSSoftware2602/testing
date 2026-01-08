import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, Platform, Modal, TouchableOpacity, Dimensions, Image } from "react-native";
import { ToastProvider, } from "react-native-toast-notifications";
// import { fonts } from '../styles/common';
import { useState, createContext } from 'react';
import useAuthGuard from './auth/check_token_expiry';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const WebToastContext = createContext();

export default function RootLayout() {
  useAuthGuard({ requireAuth: false });
  const faviconUri = Asset.fromModule(require('../assets/favicon.png')).uri;

  const setupWebToast = () => {
    if (Platform.OS === 'web') {
      // Create a web-specific toast function
      window.showWebToast = (message, options = {}) => {
        // Create toast element
        const toast = document.createElement('div');

        // Create structure for toast
        const titleEl = options.data?.title ?
          `<div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${options.data.title}</div>` : '';

        toast.innerHTML = `
          ${titleEl}
          <div style="color:#a3a3a3;font-size:14px;">${message}</div>
        `;

        // Set styles
        Object.assign(toast.style, {
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#fff',
          padding: '15px',
          borderRadius: '8px',
          borderLeft: `6px solid ${options.data?.status === 'success' ? '#00C851' : '#FF3333'}`,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: '2147483647',
          maxWidth: '400px',
          minWidth: '300px',
          fontFamily: 'Route159-Regular, sans-serif',
          opacity: '0',
          transition: 'opacity 0.3s ease',
          pointerEvents: 'auto'
        });

        // Add to DOM
        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
          toast.style.opacity = '1';
        }, 10);

        // Auto remove
        setTimeout(() => {
          toast.style.opacity = '0';
          setTimeout(() => {
            if (document.body.contains(toast)) {
              document.body.removeChild(toast);
            }
          }, 300);
        }, options.duration || 3000);

        // Return the toast element
        return toast;
      };
    }
  };

  useEffect(() => {
    setupWebToast();

    if (Platform.OS === 'web') {
      // Wait for DOM to be ready
      const setupPortal = () => {
        // Remove any existing portal first
        const existingPortal = document.getElementById('toast-portal');
        if (existingPortal) {
          document.body.removeChild(existingPortal);
        }

        // Create new portal with explicit styling
        const toastPortal = document.createElement('div');
        toastPortal.id = 'toast-portal';

        // Use explicit styling for maximum compatibility
        Object.assign(toastPortal.style, {
          position: 'fixed',
          top: '0',
          left: '0',
          width: '100%',
          height: '0',
          overflow: 'visible',
          zIndex: '2147483647', // Maximum z-index
          pointerEvents: 'none',
          display: 'block'
        });

        document.body.appendChild(toastPortal);

        // Add global styles for toasts
        const styleEl = document.createElement('style');
        styleEl.innerHTML = `
        #toast-portal * {
          z-index: 2147483647 !important;
        }
        .toast-notification {
          position: fixed !important;
          z-index: 2147483647 !important;
        }
      `;
        document.head.appendChild(styleEl);
        setupWebToast();
      };

      // Run after DOM is ready
      if (document.readyState === 'complete') {
        setupPortal();
      } else {
        window.addEventListener('load', setupPortal);
        return () => window.removeEventListener('load', setupPortal);
      }

      return () => {
        const portal = document.getElementById('toast-portal');
        if (portal && document.body.contains(portal)) {
          document.body.removeChild(portal);
        }
      };
    }
  }, []);


  const [fontsLoaded] = useFonts({
    // Adobe Song Std fonts
    'AdobeSongStd-Light': require('../assets/fonts/AdobeSongStd-Light.otf'),

    // Frick fonts
    'Frick-Regular': require('../assets/fonts/Frick0.3-Regular-3.otf'),

    // Roboto Slab fonts
    'RobotoSlab-Regular': require('../assets/fonts/RobotoSlab-Regular-2.ttf'),
    'RobotoSlab-Bold': require('../assets/fonts/Roboto-Slab-Bold-2.ttf'),

    // Route159 fonts
    'Route159-Regular': require('../assets/fonts/Route159-Regular.otf'),
    'Route159-Bold': require('../assets/fonts/Route159-Bold.otf'),
    'Route159-BoldItalic': require('../assets/fonts/Route159-BoldItalic.otf'),
    'Route159-Heavy': require('../assets/fonts/Route159-Heavy.otf'),
    'Route159-HeavyItalic': require('../assets/fonts/Route159-HeavyItalic.otf'),
    'Route159-SemiBold': require('../assets/fonts/Route159-SemiBold.otf'),
    'Route159-SemiBoldItalic': require('../assets/fonts/Route159-SemiBoldItalic.otf'),

    // Space Mono fonts
    'SpaceMono-Regular': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [orderTypeModalVisible, setOrderTypeModalVisible] = useState(false);


  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  return (
    <SafeAreaProvider>
      <Head>
        <title>US Pizza Malaysia | Weborder Online</title>
        <meta name="description" content="US Pizza - Order delicious pizzas online" />
        <link rel="icon" href={faviconUri} />
      </Head>

      <ToastProvider
        duration={2000}
        placement="top"
        offset={Platform.OS === 'web' ? 60 : 10}
        animationType={Platform.OS === 'web' ? 'zoom-in' : 'slide-in'}
        swipeEnabled={Platform.OS !== 'web'}
        onShow={(toast) => {
          // For web in production, use our custom implementation
          if (Platform.OS === 'web' && window.showWebToast) {
            // Call our custom toast implementation instead
            window.showWebToast(toast.message, {
              data: toast.data,
              duration: toast.duration
            });

            // Return true to prevent the default toast from showing in web
            return true;
          }

          // For native, continue with normal toast behavior
          return false;
        }}
        renderType={
          {
            custom_toast: (toast) => (
              <View
                style={{
                  width: "100%",
                  paddingHorizontal: 15,
                  paddingVertical: 10,
                  backgroundColor: "#fff",
                  marginVertical: 4,
                  borderRadius: 8,
                  borderTopColor: toast.data?.status === "success" ? "#00C851" : "#FF3333",
                  borderTopWidth: 6,
                  justifyContent: "center",
                  paddingLeft: 16,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    color: "#333",
                    fontWeight: "bold",
                    fontFamily: 'Route159-Bold',
                  }}
                >
                  {toast.data?.title}
                </Text>
                <Text style={{ color: "#a3a3a3", marginTop: 2, fontFamily: 'Route159-Regular', }}>{toast.message}</Text>
              </View>
            ),

          }}
      >
        <Modal
          transparent
          visible={orderTypeModalVisible}
          animationType="fade"
          onRequestClose={() => setOrderTypeModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 18,
                paddingVertical: 32,
                paddingHorizontal: 0,
                width: Math.min(Dimensions.get('window').width * 0.85, 360),
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 3,
                  right: 16,
                  zIndex: 2,
                  padding: 4,
                }}
                onPress={() => setOrderTypeModalVisible(false)}
              >
                <Text style={{ fontSize: 26, color: '#999', fontWeight: 'bold' }}>
                  ×
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontWeight: 'bold',
                  fontSize: 20,
                  marginBottom: 30,
                  textAlign: 'center',
                  color: '#C2000E',
                  fontFamily: 'Route159-SemiBoldItalic',
                }}
              >
                How would you like to{'\n'}get your order?
              </Text>

              {['Dine-in', 'Pick-up', 'Delivery'].map((type, i) => (
                <TouchableOpacity
                  key={i}
                  style={{
                    flexDirection: 'row',
                    backgroundColor: '#e3e3e3',
                    borderRadius: 14,
                    alignItems: 'center',
                    paddingVertical: 24,
                    paddingHorizontal: 18,
                    width: 280,
                    marginTop: i === 0 ? 0 : 20,
                  }}
                  onPress={() => {
                    setOrderTypeModalVisible(false);
                    // Navigate logic can be lifted up too if needed
                  }}
                >
                  <View style={{ marginRight: 20 }}>
                    <Image
                      source={
                        type === 'dinein'
                          ? require('../assets/elements/home/home_dinein.png')
                          : type === 'pickup'
                            ? require('../assets/elements/home/home_pickup.png')
                            : require('../assets/elements/home/home_delivery.png')
                      }
                      style={{ width: 58, height: 58, resizeMode: 'contain' }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 22,
                      color: '#C2000E',
                      fontWeight: 'bold',
                      fontFamily: 'Route159-HeavyItalic',
                    }}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="screens/auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="screens/auth/register" options={{ headerShown: false }} />
          {/* <Stack.Screen name="screens/auth/forgot-password" options={{ headerShown: false }} /> */}
          <Stack.Screen name="screens/auth/otp" options={{ headerShown: false }} />
        </Stack>
      </ToastProvider>
    </SafeAreaProvider >
  );
} 
