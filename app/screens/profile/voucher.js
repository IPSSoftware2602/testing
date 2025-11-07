// screens/payment/select.js
'use client';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    View,
    Dimensions,
    Image
} from 'react-native';
import TopNavigation from '../../../components/ui/TopNavigation';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import PolygonButton from '../../../components/ui/PolygonButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import useAuthGuard from '../../auth/check_token_expiry';
import { Animated, Easing } from 'react-native';

const AnimationImage = ({ image, containerStyle }) => {
    const opacityValue = useRef(new Animated.Value(1)).current;
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                // Fade out slightly + scale down
                Animated.parallel([
                    Animated.timing(opacityValue, {
                        toValue: 0.7,
                        duration: 300,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 0.95,
                        duration: 300,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
                // Brighten + scale up
                Animated.parallel([
                    Animated.timing(opacityValue, {
                        toValue: 1.2,
                        duration: 200,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1.1,
                        duration: 200,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
                // Return to normal
                Animated.parallel([
                    Animated.timing(opacityValue, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleValue, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                ]),
                // Pause
                Animated.delay(1000),
            ])
        ).start();
    }, [opacityValue, scaleValue]);

    return (
        <View style={containerStyle}>
            <Animated.Image
                source={image}
                defaultSource={require('../../../assets/elements/home/home_pickup.png')}
                style={{
                    width: 24,
                    height: 24,
                    opacity: opacityValue,
                    transform: [{ scale: scaleValue }],
                }}
                resizeMode="contain"
            />
        </View>
    );
};



const vouchers = [
    { code: 'USBEANS', description: 'RM5 off your order', discount: 5 },
    { code: 'USBEANSSS', description: '10% off for new users', discount: 10 },
    { code: 'USBEANSSSSSS', description: 'Free Delivery', discount: 0 },
];

const { width } = Dimensions.get('window');

export default function VoucherSelectScreen() {
    useAuthGuard();
    const router = useRouter();
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [voucherCode, setVoucherCode] = useState('');
    const [voucherData, setVoucherData] = useState([]);
    const [authToken, setAuthToken] = useState("");
    const [customerData, setCustomerData] = useState(null);
    const AnimatedIcon = Animated.createAnimatedComponent(Ionicons);
    const scale = useRef(new Animated.Value(1)).current;

    // loop animation (gentle breathing effect)
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(scale, {
                    toValue: 1.15,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(scale, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.delay(800),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                const customerJson = await AsyncStorage.getItem('customerData');
                const customerData = customerJson ? JSON.parse(customerJson) : null;

                setAuthToken(authToken);
                setCustomerData(customerData);


            } catch (err) {
                console.log(err);
            }
        };

        checkStoredData();
    }, [])

    useEffect(() => {
        const fetchCustomerVoucher = async () => {
            try {

                if (!authToken || !customerData?.id) return;

                const response = await axios.get(
                    `${apiUrl}voucher-list/${customerData.id}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });

                const voucherData = await response.data;
                setVoucherData(voucherData.data);

            } catch (err) {
                console.log(err);
            }
        }
        if (authToken && customerData?.id) {
            fetchCustomerVoucher();
        }

    }, [authToken, customerData])

    const renderEmptyVoucher = () => (
  <View style={styles.emptyWrapper}>
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No vouchers available.</Text>
      <Text style={styles.emptySubText}>
        You may proceed to Market to redeem a Voucher.
      </Text>

      {/* Go to Market button */}
      <TouchableOpacity
        style={styles.addVoucherButton}
        activeOpacity={0.8}
        onPress={() =>
          router.push({
            pathname: '(tabs)/market',
            params: { from: 'voucher-select' },
          })
        }
      >
        <Ionicons
          name="add-circle-outline"
          size={22}
          color="#fff"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.addVoucherText}>Go to Market</Text>
      </TouchableOpacity>
    </View>
  </View>
);


    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <TopNavigation
                    title={
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                            <Text style={{ fontFamily: "Route159-Bold", fontSize: 18, color: "#C2000E" }}>
                                My Vouchers
                            </Text>

                            <TouchableOpacity
                                onPress={() =>
                                    router.push({
                                        pathname: '(tabs)/market',
                                        params: { from: 'my-vouchers' }
                                    })
                                }
                                activeOpacity={0.7}
                                style={{ marginLeft: 12 }}
                            >
                                <AnimatedIcon
                                    name="storefront-outline"
                                    size={26}
                                    color="#C2000E"
                                    style={{
                                        transform: [{ scale }],
                                    }}
                                />
                            </TouchableOpacity>

                        </View>
                    }
                    isBackButton={true}
                    navigatePage={() => router.push('(tabs)/profile')}
                />
                <ScrollView
                    contentContainerStyle={[styles.container, { paddingHorizontal: 24 }]}
                    showsVerticalScrollIndicator={false}
                >
                    {voucherData.length === 0 ? renderEmptyVoucher() : (
                        voucherData.map((voucher) => (
                            <View
                                key={voucher.id}
                                style={styles.voucherCard}
                            >
                                {/* Top 70% Image Section */}
                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/screens/voucher/voucher_details',
                                            params: { voucher: JSON.stringify(voucher), from: 'profile' },
                                        })
                                    }
                                >
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: voucher.voucher_image_url || 'https://icom.ipsgroup.com.my/backend/uploads/menu_images/6_1760066613_0.jpg' }}
                                            style={styles.voucherImage}
                                            resizeMode="cover"
                                        />
                                    </View>
                                </TouchableOpacity>


                                <TouchableOpacity
                                    activeOpacity={0.8}
                                    onPress={() => {
                                        if (selectedVoucher?.voucher_code === voucher.voucher_code) {
                                            setSelectedVoucher(null);
                                        } else {
                                            setSelectedVoucher(voucher);
                                        }
                                    }}
                                >
                                    <View style={styles.voucherInfo}>
                                        <View style={styles.infoColumn}>
                                            {/* Icon beside label */}
                                            <View style={styles.infoHeaderRow}>
                                                <Ionicons name="time-outline" size={16} color="#aaa" style={styles.infoIcon} />
                                                <Text style={styles.infoLabel}>Validity</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{voucher.voucher_expiry_date || 'No validity period'}</Text>
                                        </View>

                                        <View style={styles.infoColumn}>
                                            {/* Icon beside label */}
                                            <View style={styles.infoHeaderRow}>
                                                <Ionicons name="cash-outline" size={16} color="#aaa" style={styles.infoIcon} />
                                                <Text style={styles.infoLabel}>Title</Text>
                                            </View>
                                            <Text style={styles.infoValue}>{voucher.title || 'No title provided.'}</Text>
                                        </View>
                                    </View>

                                </TouchableOpacity>

                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </ResponsiveBackground>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingVertical: 16,
    },
    sectionTitle: {
        fontFamily: 'Route159-Bold',
        fontSize: 18,
        color: '#C2000E',
        marginBottom: 4,
        paddingLeft: 4,
    },
    voucherCard: {
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#fff',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 3,
    },

    selectedVoucher: {
        borderColor: '#C2000E',
        backgroundColor: '#FFF5F5',
    },
    voucherSelection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        flexWrap: 'nowrap',
    },
    voucherDetails: {
        marginLeft: 12,
        flex: 1,
        alignContent: 'center',
        justifyContent: 'center',
        marginTop: width <= 768 ? 20 : 5,
    },
    radioButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#C2000E',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioButtonSelected: {
        borderColor: '#C2000E',
    },
    radioButtonInner: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#C2000E',
    },
    voucherInput: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontFamily: 'Route159-Regular',
        outlineStyle: 'none',
    },
    voucherInputSection: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#F9F9F9',
    },
    voucherInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        borderWidth: 1,
        borderColor: '#DADADA',
        paddingHorizontal: 12,
        height: 50,
    },
    voucherIcon: {
        marginRight: 8,
    },
    bottomBar: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    confirmButtonText: {
        fontFamily: 'Route159-HeavyItalic',
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    disabledButtonText: {
        color: '#fff',
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        width: Math.min(width * 0.8, 400),
    },

    emptyText: {
        fontSize: 18,
        fontFamily: 'Route159-Bold',
        color: '#C2000E',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        fontFamily: 'Route159-Regular',
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    voucherCode: {
        fontFamily: 'Route159-Bold',
        fontSize: width <= 360 ? 14 : 16,
        color: '#C2000E',
        lineHeight: width <= 360 ? 14 : 16,
    },
    voucherDescription: {
        fontFamily: 'Route159-Regular',
        fontSize: width <= 360 ? 12 : 14,
        color: '#555',
        marginTop: 4,
        lineHeight: width <= 360 ? 14 : 16,
    },
    imageContainer: {
        height: 160,
        position: 'relative',
    },

    voucherImage: {
        width: '100%',
        height: '100%',
    },

    imageOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },

    discountText: {
        fontSize: 28,
        color: '#fff',
        fontFamily: 'Route159-Bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },

    subText: {
        fontSize: 14,
        color: '#fff',
        marginTop: 4,
        fontFamily: 'Route159-Regular',
    },

    voucherInfo: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },

    infoRow: {
        alignItems: 'center',
    },

    infoLabel: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'Route159-Regular',
        textAlign: 'center',
    },

    infoValue: {
        fontSize: 14,
        color: '#C2000E',
        fontFamily: 'Route159-Bold',
        textAlign: 'center',
    },

    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        height: 40,
    },

    infoIcon: {
        marginRight: 4,
        marginTop: 0,
    },

    divider: {
        height: 24,
        width: 1,
        backgroundColor: '#e0e0e0',
    },

    tickButton: {
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    infoColumn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    infoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addVoucherButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#C2000E',
        borderRadius: 25,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginTop: 10,
        shadowColor: '#C2000E',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    addVoucherText: {
        fontFamily: 'Route159-Bold',
        color: '#fff',
        fontSize: 16,
    },
    emptyContainerWrapper: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    emptyWrapper: {
  flex: 1,
  justifyContent: 'center', // centers vertically
  alignItems: 'center',     // centers horizontally
  minHeight: Dimensions.get('window').height * 0.7, // ensures it stays mid-screen
},



});