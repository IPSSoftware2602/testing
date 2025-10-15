// screens/payment/loading_payment.js
'use client';

import React from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { FontAwesome } from "@expo/vector-icons";
import { FontAwesome6 } from '@expo/vector-icons';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
// import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');



export default function PaymentStatus() {
    // useAuthGuard();
    const { orderId, paymentStatus, type } = useLocalSearchParams();
    const isSuccess = paymentStatus === 'success';
    const router = useRouter();

    const handleRedirect = () => {
        router.replace(`/screens/orders/orders_details?orderId=${orderId}`);
    }

    return (
        <ResponsiveBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.contentWrapper}>
                    {/* Icon */}
                    <View style={[styles.iconCircle, isSuccess ? styles.successCircle : styles.failCircle]}>
                        {isSuccess ? (
                            <FontAwesome name="check-circle" size={90} color="#28a745" />
                        ) : (
                            <FontAwesome name="times-circle" size={90} color="#C2000E" />
                        )}
                    </View>

                    {/* Status Text */}
                    <Text style={[styles.statusText, isSuccess ? styles.successText : styles.failText]}>
                        {isSuccess ? 'Payment Successful' : 'Payment Failed'}
                    </Text>

                    {/* Subtext */}
                    <Text style={styles.subText}>
                        {isSuccess
                            ? 'Thank you for your payment! Your order is being processed.'
                            : 'Your payment could not be completed. Please try again or contact support.'}
                    </Text>
                </View>

                {/* Track Order Button at the very bottom */}

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={type === "order" ? () => handleRedirect() : paymentStatus === "success" ? () => router.replace('(tabs)/profile') : () => router.replace('/screens/profile/topup')}
                    >
                        <CustomTabBarBackground
                            width={Math.min(width, 440) * 0.7}
                        />
                        <Text style={styles.bottombtnText}>{type === "order" ? "Track Order Details" : paymentStatus === "success" ? "Back to Home" : "Topup Again"}</Text>
                    </TouchableOpacity>
                </View>


            </SafeAreaView>
        </ResponsiveBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    contentWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        backgroundColor: '#f5f5f5',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        elevation: 4,
    },
    successCircle: {
        borderWidth: 3,
        borderColor: '#28a745',
    },
    failCircle: {
        borderWidth: 3,
        borderColor: '#C2000E',
    },
    statusText: {
        fontSize: 28,
        fontFamily: 'Route159-Bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    successText: {
        color: '#28a745',
    },
    failText: {
        color: '#C2000E',
    },
    subText: {
        fontSize: 16,
        color: '#666',
        fontFamily: 'Route159-Regular',
        textAlign: 'center',
        marginBottom: 24,
    },
    bottomBar: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: 'transparent',
        borderTopWidth: 1,
        borderTopColor: 'transparent',
        // marginBottom: '2%'
    },
    bottombtnText: {
        fontFamily: 'Route159-Heavy',
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    trackOrderBtn: {
        width: '90%',
        alignSelf: 'center',
        backgroundColor: '#C2000E',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    trackOrderText: {
        color: '#fff',
        fontSize: 18,
        fontFamily: 'Route159-Bold',
        letterSpacing: 0.5,
    },
});