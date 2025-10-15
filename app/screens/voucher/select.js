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
    Dimensions
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
                <TopNavigation title="Voucher Wallet" isBackButton={true} navigatePage={() => router.push('/screens/orders/checkout')} />

                <View style={styles.voucherInputSection}>
                    <Text style={styles.sectionTitle}>Add Voucher</Text>
                    <View style={styles.voucherInputContainer}>
                        <Ionicons name="ticket-outline" size={24} color="#999" style={styles.voucherIcon} />
                        <TextInput
                            style={styles.voucherInput}
                            placeholder="E.g. : USBEANS"
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
                    contentContainerStyle={[styles.container, { paddingHorizontal: 16 }]}
                    style={{ marginBottom: 80 }}
                    showsVerticalScrollIndicator={false}
                >
                    {voucherData.length === 0 ? renderEmptyVoucher() : voucherData.map((voucher) => (
                        <TouchableOpacity
                            key={voucher.id}
                            style={[
                                styles.voucherCard,
                                selectedVoucher?.voucher_code === voucher.voucher_code && styles.selectedVoucher
                            ]}
                            onPress={() => setSelectedVoucher(voucher)}
                        >
                            <View style={styles.voucherSelection}>
                                {/* Radio button */}
                                <View style={[
                                    styles.radioButton,
                                    selectedVoucher?.voucher_code === voucher.voucher_code && styles.radioButtonSelected
                                ]}>
                                    {selectedVoucher?.voucher_code === voucher.voucher_code && (
                                        <View style={styles.radioButtonInner} />
                                    )}
                                </View>

                                {/* Voucher details */}
                                <View style={styles.voucherDetails}>
                                    <Text style={styles.voucherCode}>{voucher.title}</Text>
                                    <Text style={styles.voucherDescription}>{voucher.description}</Text>
                                </View>
                            </View>

                            <Ionicons name="chevron-forward" size={24} color="#C2000E" />
                        </TouchableOpacity>
                    ))}
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
        backgroundColor: '#fff',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
});