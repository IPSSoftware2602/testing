import { AntDesign, Feather, Ionicons, FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  View,
  Text,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { WebView } from 'react-native-webview';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { useRouter } from 'expo-router'; 
import { SafeAreaView } from 'react-native-safe-area-context';


export default function EInvoice() {
  const router = useRouter();
  const pdfUrl = "https://example.com/path/to/irbm-einvoice.pdf";

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
          navigatePage={() => router.push('(tabs)/orders')}
        />
      </SafeAreaView>
    </ResponsiveBackground>
  );
}
