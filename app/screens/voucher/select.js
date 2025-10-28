// screens/payment/select.js
'use client';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect, use } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    TextInput,
    View,
    Dimensions,
    Image,
    Platform
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

    const handleApplyManualVoucher = () => {

        if (voucherCode.trim()) {
            const foundVoucher = vouchers.find(v => v.code === voucherCode.trim());
            const voucher = foundVoucher
                ? foundVoucher
                : { voucher_code: voucherCode.trim() };
            setSelectedVoucher(voucher);
            handleConfirm(voucher); // Pass the voucher directly
        }
    };

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
                console.log(voucherData.data);

            } catch (err) {
                console.log(err);
            }
        }
        if (authToken && customerData?.id) {
            fetchCustomerVoucher();
        }

    }, [authToken, customerData])

    const handleConfirm = (voucherParam) => {
        const voucher = voucherParam ?? selectedVoucher;
        if (voucher) {
            router.push({
                pathname: '/screens/orders/checkout',
                params: {
                    selectedVoucher: JSON.stringify(voucher)
                }
            });
        }
    };


    const renderEmptyVoucher = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No vouchers available.</Text>
            <Text style={styles.emptySubText}>You may proceed to Market to exchange Voucher or enter Promo Code.</Text>
        </View>
    );

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
                <TopNavigation
                    title={
                        <View style={{ flexDirection: "row", alignItems: "center" }}>
                        <Text style={{ fontFamily: "Route159-Bold", fontSize: 18, color: "#C2000E" }}>
                            Voucher Wallet
                        </Text>

                        <TouchableOpacity
                            onPress={() =>
                            router.push({
                                pathname: '(tabs)/market',
                                params: { from: 'voucher-select' }
                            })
                            }
                            style={{ marginLeft: 12 }}
                        >
                            <Ionicons name="storefront-outline" size={22} color="#C2000E" />
                        </TouchableOpacity>
                        </View>
                    }
                    isBackButton={true}
                    navigatePage={() => router.push('/screens/orders/checkout')}
                />
                <View style={styles.voucherInputSection}>
                    <Text style={styles.sectionTitle}>Add Voucher</Text>
                    <View style={styles.voucherInputContainer}>
                        <Ionicons name="ticket-outline" size={24} color="#999" style={styles.voucherIcon} />
                        <TextInput
                            style={styles.voucherInput}
                            placeholder="E.g. : Sedap Points"
                            placeholderTextColor="#999"
                            value={voucherCode}
                            onChangeText={setVoucherCode}
                        />
                        <PolygonButton
                            text="APPLY"
                            width={120}
                            height={25}
                            color="#C2000E"
                            textColor="#fff"
                            textStyle={{ fontWeight: 'bold', fontSize: 16 }}
                            onPress={handleApplyManualVoucher}
                        // onPress={handleConfirm}
                        />
                    </View>
                </View>

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
                                            params: { voucher: JSON.stringify(voucher), from: 'select' },
                                        })
                                    }
                                >
                                    <View style={styles.imageContainer}>
                                        <Image
                                            source={{ uri: voucher.voucher_image_url || 'https://icom.ipsgroup.com.my/backend/uploads/menu_images/6_1760066613_0.jpg' }}
                                            style={styles.voucherImage}
                                        // resizeMode="cover"
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
                                        <View style={styles.infoItem}>
                                            <View style={styles.infoHeaderRow}>
                                                <Ionicons name="time-outline" size={16} color="#aaa" style={styles.infoIcon} />
                                                <Text
                                                    style={styles.infoLabel}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    Validity
                                                </Text>
                                            </View>
                                            <Text
                                                style={[styles.infoValue, { color: '#C2000E' }]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {voucher.voucher_expiry_date || 'No validity period'}
                                            </Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.infoItem}>
                                            <View style={styles.infoHeaderRow}>
                                                <Ionicons name="cash-outline" size={16} color="#aaa" style={styles.infoIcon} />
                                                <Text
                                                    style={styles.infoLabel}
                                                    numberOfLines={1}
                                                    ellipsizeMode="tail"
                                                >
                                                    Title
                                                </Text>
                                            </View>
                                            <Text
                                                style={[styles.infoValue, { color: '#C2000E' }]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                            >
                                                {voucher.title || 'No title provided.'}
                                            </Text>
                                        </View>

                                        <View style={styles.divider} />

                                        <View style={styles.tickButton}>
                                            <Ionicons
                                                name={selectedVoucher?.voucher_code === voucher.voucher_code ? "checkmark-circle" : "ellipse-outline"}
                                                size={22}
                                                color={selectedVoucher?.voucher_code === voucher.voucher_code ? "#C2000E" : "#ccc"}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={() => handleConfirm()}
                        disabled={!selectedVoucher}
                    >
                        <CustomTabBarBackground />
                        <Text style={[
                            styles.confirmButtonText,
                            !selectedVoucher && styles.disabledButtonText
                        ]}>
                            REDEEM VOUCHER
                        </Text>
                    </TouchableOpacity>
                </View>
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
        color: '#ffffffff',
    },
    emptyContainer: {
        flex: 1,
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
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#fff',
        overflow: 'hidden',
        height: Platform.OS === 'web' ? 200 : undefined,
    },
    voucherImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        transform: [{ scale: 1 }], // zoom out a bit
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
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#fff',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },

    infoRow: {
        alignItems: 'center',
    },

    infoItem: {
        flex: 1,
        minWidth: 0,              // allow Text to shrink and truncate
        alignItems: 'center',     // center within each block
        justifyContent: 'center',
        gap: 4,
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

    infoHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    infoLabel: {
        fontSize: 12,
        color: '#999',
        fontFamily: 'Route159-Regular',
        textAlign: 'center',
        maxWidth: '100%',
    },

    infoValue: {
        fontSize: 14,
        fontFamily: 'Route159-Bold',
        textAlign: 'center',
        maxWidth: '100%',
    },


});