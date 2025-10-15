// screens/payment/loading_payment.js
'use client';

import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    StyleSheet,
    Image,
    Text,
    View,
    Animated,
    // Dimensions,
} from 'react-native';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
// import useAuthGuard from '../../auth/check_token_expiry';
// const { width, height } = Dimensions.get('window');

export default function LoadingPayment() {
    // useAuthGuard();
    const router = useRouter();
    const [loadingText, setLoadingText] = useState('Processing payment...');
    const [loadingDots, setLoadingDots] = useState('');

    const { type } = useLocalSearchParams();
    // console.log(type);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;
    const rotateAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pollingIntervalRef = useRef();
    const pizzaIcon = require('../../../assets/elements/home/home_dinein.png');

    useEffect(() => {
        // Start animations
        startAnimations();

        // Loading text animation
        const textInterval = setInterval(() => {
            setLoadingDots(prev => {
                if (prev.length >= 3) return '';
                return prev + '.';
            });
        }, 500);

        // Loading text cycle
        const textCycle = setInterval(() => {
            setLoadingText(prev => {
                switch (prev) {
                    case 'Processing payment...':
                        return 'Verifying transaction...';
                    case 'Verifying transaction...':
                        return 'Securing payment...';
                    case 'Securing payment...':
                        return 'Processing payment...';
                    default:
                        return 'Processing payment...';
                }
            });
        }, 2000);

        // Payment status polling
        const POLL_INTERVAL = 2000; // Check every 2 seconds
        const MAX_ATTEMPTS = 10; // Max 10 attempts (~20 seconds)
        let attempts = 0;


        const pollPaymentStatus = async () => {
            attempts++;
            const token = await AsyncStorage.getItem('authToken') || '';
            const orderId = await AsyncStorage.getItem('orderId') || '';
            const topupId = await AsyncStorage.getItem('topupId') || '';
            if (!token) {
                clearInterval(pollingIntervalRef.current);
                // Redirect to login or show a message
                router.replace('/screens/auth/login');
                return;
            }

            try {
                let response;
                if (type === "order") {
                    response = await axios.get(
                        `${apiUrl}payment/check/${orderId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                } else if (type === "topup") {
                    response = await axios.get(
                        `${apiUrl}topup/check/${topupId}`,
                        { headers: { Authorization: `Bearer ${token}` } }
                    );
                }

                // Handle successful response (status 200)
                console.log(response.data);
                if (response.data.status === 200 && response.data.result === "Success") {
                    // console.log(response.data.status, response.data.result);

                    clearInterval(pollingIntervalRef.current);
                    await AsyncStorage.removeItem('orderId');
                    await AsyncStorage.removeItem('topupId');
                    router.replace({
                        pathname: '/screens/payment/payment_status',
                        params: { orderId: response.data.order_id, paymentStatus: 'success', type: type }
                    });
                }
                else if (response.data.status === 400 && response.data.result === "Failed") {
                    clearInterval(pollingIntervalRef.current);
                    await AsyncStorage.removeItem('orderId');
                    await AsyncStorage.removeItem('topupId');
                    router.replace({
                        pathname: '/screens/payment/payment_status',
                        params: { orderId: response.data.order_id, paymentStatus: 'fail', type: type }
                    });
                }

            } catch (error) {
                // Handle 400 and other errors
                // console.log(error);
                if (error.response?.status === 400) {
                    clearInterval(pollingIntervalRef.current);
                    router.replace({
                        pathname: '/screens/payment/payment_status',
                        params: { orderID: error.response.order_id, paymentStatus: 'fail', type: type }
                    });
                } else {
                    console.error('Polling error:', error);
                    // Continue polling for network errors
                }
            }

            // Stop after max attempts
            if (attempts >= MAX_ATTEMPTS) {
                if (type === "order") {
                    clearInterval(pollingIntervalRef.current);
                    router.replace({
                        pathname: '(tabs)/orders',
                        params: { error: 'Payment status unknown' }
                    });
                }
                else if (type === "topup") {
                    clearInterval(pollingIntervalRef.current);
                    router.replace({
                        pathname: '(tabs)/profile',
                        params: { error: 'Payment status unknown' }
                    });
                }
            }
        };

        // Start polling interval
        pollingIntervalRef.current = setInterval(pollPaymentStatus, POLL_INTERVAL);

        // Initial immediate check
        pollPaymentStatus();

        // Cleanup
        return () => {
            clearInterval(textInterval);
            clearInterval(textCycle);
            clearInterval(pollingIntervalRef.current);
        };
    }, [router]);

    const startAnimations = () => {
        // Fade in animation
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();

        // Scale animation
        Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();

        // Continuous rotation
        Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();

        // Pulse animation
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    };

    const spin = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    return (
        <ResponsiveBackground>
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    {/* Animated Icon */}
                    <Animated.View
                        style={[
                            styles.iconContainer,
                            {
                                opacity: fadeAnim,
                                transform: [
                                    { scale: scaleAnim },
                                    { rotate: spin },
                                    { scale: pulseAnim }
                                ],
                            },
                        ]}
                    >
                        <Image source={pizzaIcon} style={styles.orderTypeIcon} />
                    </Animated.View>

                    {/* Loading Text */}
                    <Animated.View
                        style={[
                            styles.textContainer,
                            {
                                opacity: fadeAnim,
                            },
                        ]}
                    >
                        <Text style={styles.loadingTitle}>Payment Processing</Text>
                        <Text style={styles.loadingText}>
                            {loadingText}{loadingDots}
                        </Text>
                    </Animated.View>

                </View>
            </SafeAreaView>
        </ResponsiveBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 40,
    },
    orderTypeIcon: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
    },
    textContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    loadingTitle: {
        fontSize: 24,
        fontFamily: 'Route159-Bold',
        color: '#1a1a1a',
        marginBottom: 12,
        textAlign: 'center',
    },
    loadingText: {
        fontSize: 16,
        fontFamily: 'Route159-Regular',
        color: '#666',
        textAlign: 'center',
        minHeight: 24,
    },
    spinnerContainer: {
        marginBottom: 30,
    },
    progressContainer: {
        width: '100%',
        maxWidth: 300,
    },
    progressBar: {
        height: 4,
        backgroundColor: '#f0f0f0',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#C2000E',
        borderRadius: 2,
    },
});