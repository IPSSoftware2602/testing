import React, { useRef, useState, useEffect } from "react";
import { View, ActivityIndicator, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { WebView } from "react-native-webview";
import * as Linking from 'expo-linking';

export default function PaymentScreen({ url, onClose }) {
    const webRef = useRef(null);
    const [loading, setLoading] = useState(true);
    // const [webkey, setWebkey] = useState(0);

    const RETURN_URL = "https://order.uspizza.my/screens/payment/loading_payment";
    const FIUU_RETURN_URL = "https://pay.fiuu.com/MOLPay/return_merchant.php?";
    const NO_TOKEN_URL = "https://order.uspizza.my/screens/auth/login";
    const CANCEL_URL = "https://order.uspizza.my/screens/payment/cancel";
    // If you use deep links instead:
    const RETURN_SCHEME = "uspizzaapp://payment/loading_payment";


    const handleNav = (navState) => {

        const nextUrl = navState?.url || navState;
        // console.log("WebView nav:", nextUrl, "RETURN_URL:", RETURN_URL);
        const isReturn = nextUrl.includes(RETURN_URL) || nextUrl.includes(RETURN_SCHEME) || nextUrl.includes(FIUU_RETURN_URL);
        const isLogout = nextUrl.includes(NO_TOKEN_URL);
        const isCancel = nextUrl.includes(CANCEL_URL);

        if (isReturn || isCancel || isLogout) {
            webRef.current?.stopLoading();
            onClose();
            return false;
        }
        return true;
    };


    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
            <WebView
                style={{ flex: 1 }}
                // key={webkey}
                ref={webRef}
                source={{ uri: url }}
                onLoadStart={() => {
                    // console.log("WebView loading started");
                    setLoading(true);
                }}
                // onLoadEnd={() => setLoading(false)}
                onShouldStartLoadWithRequest={handleNav}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                sharedCookiesEnabled={true}
                thirdPartyCookiesEnabled={true}
                // startInLoadingState={true}
                onError={event => {
                    // console.log("WebView error:", event.nativeEvent);
                    setLoading(false);
                }}
                onLoadEnd={() => {
                    // if (loading) {
                    // setWebkey(Date.now());
                    // console.log("WebView loaded successfully");
                    setLoading(false);
                    // }
                }}
            />
            {loading && (
                <View style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(255,255,255,0.3)'
                }}>
                    <ActivityIndicator size="large" color="#C2000E" />
                </View>
            )}
            <TouchableOpacity
                style={{
                    position: 'absolute',
                    top: 50,
                    right: 25,
                    zIndex: 10,
                    backgroundColor: '#fff',
                    padding: 8,
                    borderRadius: 20,
                    elevation: 2,
                }}
                onPress={onClose}
            >
                <Text style={{ color: '#C2000E', fontWeight: 'bold', fontSize: 18 }}>Close</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}