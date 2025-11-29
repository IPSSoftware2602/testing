import { AntDesign, Feather, Ionicons, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { WebView } from 'react-native-webview';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import useAuthGuard from '../../auth/check_token_expiry';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EInvoice() {
  useAuthGuard();
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    const fetchEInvoice = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        // The user requested /order/get-order/{order_id}
        // Based on generalreceipt.js, it seems we might need customer_id too, but the user specifically asked for /order/get-order/{order_id}
        // Let's try to follow the user's instruction first, but keep in mind generalreceipt.js uses `${apiUrl}order/${orderId}/${customer_id}`
        // Wait, the user said "call api route /order/get-order/{order_id}"
        // Let's assume the route is exactly as requested.

        const res = await axios.get(`${apiUrl}order/get-order/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.data && res.data.data && res.data.data.EInvoiceUrl) {
          setUrl(res.data.data.EInvoiceUrl);
        } else {
          Alert.alert('Error', 'E-Invoice URL not found.');
        }
      } catch (err) {
        console.error('Error fetching e-invoice:', err);
        Alert.alert('Error', 'Failed to load e-invoice.');
      } finally {
        setLoading(false);
      }
    };

    fetchEInvoice();
  }, [orderId]);

  const renderContent = () => {
    if (loading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#C2000E" />
          <Text style={{ marginTop: 10 }}>Loading E-Invoice...</Text>
        </View>
      );
    }

    if (!url) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>No E-Invoice available.</Text>
        </View>
      );
    }

    if (Platform.OS === 'web') {
      return (
        <iframe
          src={url}
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="E-Invoice"
        />
      );
    }

    // Android PDF handling
    const isPdf = url.toLowerCase().endsWith('.pdf');
    const sourceUrl = (Platform.OS === 'android' && isPdf)
      ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`
      : url;

    return (
      <WebView
        source={{ uri: sourceUrl }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C2000E" />
          </View>
        )}
      />
    );
  };

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation
          title={
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "Route159-Bold",
                  fontSize: 18,
                  color: "#C2000E",
                  marginRight: 12
                }}
              >
                IRBM e-Invoice
              </Text>
            </View>
          }
          isBackButton={true}
          navigatePage={() => router.back()}
        />
        {renderContent()}
      </SafeAreaView>
    </ResponsiveBackground>
  );
}
