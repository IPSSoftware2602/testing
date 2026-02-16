import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Dimensions,
    Platform,
    TouchableOpacity,
    Linking,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl, imageUrl } from '../constant/constants';
import ResponsiveBackground from '../../components/ResponsiveBackground';

const { width } = Dimensions.get('window');

export default function QrLandingScreen() {
    const { code } = useLocalSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState('loading'); // loading | resolved | error
    const [errorMsg, setErrorMsg] = useState('');
    const [qrData, setQrData] = useState(null);

    useEffect(() => {
        if (!code) {
            setStatus('error');
            setErrorMsg('Invalid QR code.');
            return;
        }
        resolveQr(code);
    }, [code]);

    const resolveQr = async (qrCode) => {
        try {
            setStatus('loading');
            const response = await axios.get(`${apiUrl}qr/${qrCode}`);
            const result = response.data?.result;

            if (!result || !result.outlet) {
                setStatus('error');
                setErrorMsg('This QR code is invalid or no longer active.');
                return;
            }

            setQrData(result);
            setStatus('resolved');

            // Check if user is logged in
            const authToken = await AsyncStorage.getItem('authToken');
            const customerData = await AsyncStorage.getItem('customerData');

            if (authToken && customerData) {
                // Logged in — store QR data and go directly to menu
                await storeQrDataAndNavigate(result);
            } else {
                // Not logged in — store pendingQrData and redirect to login
                await AsyncStorage.setItem('pendingQrData', JSON.stringify(result));
                router.replace('/screens/auth/login');
            }
        } catch (err) {
            console.error('QR resolve error:', err);
            setStatus('error');
            if (err.response?.status === 404) {
                setErrorMsg('This QR code was not found.');
            } else {
                setErrorMsg('Failed to load QR code. Please try again.');
            }
        }
    };

    const storeQrDataAndNavigate = async (data) => {
        try {
            // Set order type to delivery
            await AsyncStorage.setItem('orderType', 'delivery');

            // Store delivery address from QR data
            const addressObj = {
                name: data.delivery_address?.name || '',
                phone: data.delivery_address?.phone || '',
                address: data.delivery_address?.address || '',
                unit: data.delivery_address?.unit || '',
                note: data.delivery_address?.note || '',
                latitude: data.delivery_address?.latitude || '',
                longitude: data.delivery_address?.longitude || '',
                isQrAddress: true,
                unique_code: data.unique_code,
            };
            await AsyncStorage.setItem('deliveryAddressDetails', JSON.stringify(addressObj));

            // Store QR-specific data (menu_item_ids, logo, unique_code)
            await AsyncStorage.setItem('uniqueQrData', JSON.stringify({
                unique_code: data.unique_code,
                name: data.name,
                logo: data.logo,
                address: data.delivery_address?.address || '',
                menu_item_ids: data.menu_item_ids || [],
            }));

            // Clear any pending QR data
            await AsyncStorage.removeItem('pendingQrData');

            // Navigate to menu with QR params (menu screen's handleQR will fetch outlet details)
            router.replace({
                pathname: '/screens/menu',
                params: {
                    orderType: 'delivery',
                    outletId: String(data.outlet.id),
                    fromQR: '1',
                },
            });
        } catch (err) {
            console.error('Error storing QR data:', err);
            setErrorMsg('Something went wrong. Please try again.');
            setStatus('error');
        }
    };

    const handleOpenInApp = () => {
        const deepLink = `uspizzanewapp://qr/${code}`;
        Linking.openURL(deepLink).catch(() => {
            // App not installed — could redirect to store
            Linking.openURL('https://order.uspizza.my');
        });
    };

    const logoUri = qrData?.logo
        ? `${imageUrl}unique_qr/${qrData.logo}`
        : null;

    return (
        <ResponsiveBackground>
            <View style={styles.container}>
                {/* Web-only: Open in App banner */}
                {Platform.OS === 'web' && status !== 'loading' && (
                    <TouchableOpacity style={styles.appBanner} onPress={handleOpenInApp}>
                        <Image
                            source={require('../../assets/images/uspizza-newicon.png')}
                            style={styles.appBannerIcon}
                        />
                        <View style={styles.appBannerTextContainer}>
                            <Text style={styles.appBannerTitle}>US Pizza</Text>
                            <Text style={styles.appBannerSubtitle}>Open in App</Text>
                        </View>
                        <View style={styles.appBannerButton}>
                            <Text style={styles.appBannerButtonText}>OPEN</Text>
                        </View>
                    </TouchableOpacity>
                )}

                <View style={styles.content}>
                    {status === 'loading' && (
                        <View style={styles.center}>
                            <ActivityIndicator size="large" color="#C2000E" />
                            <Text style={styles.loadingText}>Loading your QR code...</Text>
                        </View>
                    )}

                    {status === 'resolved' && (
                        <View style={styles.center}>
                            {logoUri && (
                                <Image source={{ uri: logoUri }} style={styles.logo} resizeMode="contain" />
                            )}
                            <ActivityIndicator size="large" color="#C2000E" style={{ marginTop: 20 }} />
                            <Text style={styles.loadingText}>Redirecting...</Text>
                        </View>
                    )}

                    {status === 'error' && (
                        <View style={styles.center}>
                            <Image
                                source={require('../../assets/images/uspizza-newicon.png')}
                                style={styles.errorLogo}
                                resizeMode="contain"
                            />
                            <Text style={styles.errorTitle}>Oops!</Text>
                            <Text style={styles.errorText}>{errorMsg}</Text>
                            <TouchableOpacity
                                style={styles.retryButton}
                                onPress={() => code && resolveQr(code)}
                            >
                                <Text style={styles.retryButtonText}>Try Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.homeButton}
                                onPress={() => router.replace('/(tabs)')}
                            >
                                <Text style={styles.homeButtonText}>Go to Home</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </ResponsiveBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFF4E1',
        width: Math.min(width, 440),
        alignSelf: 'center',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    center: {
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
        fontFamily: 'Route159-Regular',
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 16,
    },
    errorLogo: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    errorTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#C2000E',
        fontFamily: 'Route159-Heavy',
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        fontFamily: 'Route159-Regular',
        marginBottom: 24,
        lineHeight: 22,
    },
    retryButton: {
        backgroundColor: '#C2000E',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 12,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'Route159-Bold',
    },
    homeButton: {
        paddingHorizontal: 32,
        paddingVertical: 12,
    },
    homeButtonText: {
        color: '#C2000E',
        fontSize: 14,
        fontFamily: 'Route159-Regular',
        textDecorationLine: 'underline',
    },
    // Web-only app banner
    appBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    appBannerIcon: {
        width: 40,
        height: 40,
        borderRadius: 8,
    },
    appBannerTextContainer: {
        flex: 1,
        marginLeft: 12,
    },
    appBannerTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        fontFamily: 'Route159-Bold',
    },
    appBannerSubtitle: {
        fontSize: 12,
        color: '#888',
        fontFamily: 'Route159-Regular',
    },
    appBannerButton: {
        backgroundColor: '#C2000E',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 16,
    },
    appBannerButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'Route159-Bold',
    },
});
