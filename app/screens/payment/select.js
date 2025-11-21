// screens/payment/select.js
'use client';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Dimensions
} from 'react-native';
import TopNavigation from '../../../components/ui/TopNavigation';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import PolygonButton from '../../../components/ui/PolygonButton';
import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');

const paymentMethodsAll = [
  { id: 'wallet', name: 'US Pizza Wallet', icon: 'wallet', iconType: 'ionicons', },
  { id: 'razerpay', name: 'Online Payment', icon: require('../../../assets/elements/order/fiuu-icon.png'), iconType: 'image', },
];

// Grouped Razorpay services with categories and placeholder images
const razorpayServiceCategories = [
  {
    title: 'FPX / Online Banking',
    services: [
      { name: 'Maybank2U', image: require('../../../assets/elements/order/maybank-icon.png') },
      { name: 'CIMB', image: require('../../../assets/elements/order/cimb-icon.webp') },
      { name: 'Public Bank', image: require('../../../assets/elements/order/publicbank-icon.png') },
      { name: 'Hong Leong', image: require('../../../assets/elements/order/hongleong-icon.jpg') },
    ]
  },
  {
    title: 'E-Wallets',
    services: [
      { name: 'Touch n Go', image: require('../../../assets/elements/order/tng-icon.png') },
      { name: 'Boost', image: require('../../../assets/elements/order/boost-icon.png') },
      { name: 'GrabPay', image: require('../../../assets/elements/order/grabpay-icon.png') },
      { name: 'ShopeePay', image: require('../../../assets/elements/order/shopee-icon.png') },
    ]
  },
  {
    title: 'Credit / Debit Cards',
    services: [
      { name: 'Visa', image: require('../../../assets/elements/order/visa-icon.png') },
      { name: 'Mastercard', image: require('../../../assets/elements/order/mastercard-icon.png') },
      // { name: 'American Express', image: require('../../../assets/elements/order/razorpay-icon.png') },
    ]
  },
];

export default function PaymentSelectScreen() {
  useAuthGuard();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [customerData, setCustomerData] = useState(null);

  const handleSelect = (methodId) => {
    setSelectedMethod(methodId);
  };

  const handleConfirm = async () => {
    if (selectedMethod) {
      try {
        await AsyncStorage.setItem('paymentMethod', selectedMethod);
      } catch (err) {
        console.log(err);
      }
      // router.back();
      handleNavigateBack();
    }
  };

  useEffect(() => {

    const fetchPaymentMethod = async () => {
      try {
        const paymentMethod = await AsyncStorage.getItem('paymentMethod');
        console.log(paymentMethod);
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;
        const enableWallet = customerData?.enable_wallet;
        if (!enableWallet) {
          paymentMethods = paymentMethodsAll.filter(m => m.id !== 'wallet');

        }
        // console.log(paymentMethods);
        // console.log(customerData);
        console.log(paymentMethod);
        setCustomerData(customerData);
        if (!enableWallet) {
          setSelectedMethod('razerpay');
        } else {
          setSelectedMethod(paymentMethod);
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }

    fetchPaymentMethod();
  }, [router])

  let paymentMethods = paymentMethodsAll;
  if (params?.type === 'topup' || !customerData?.enable_wallet) {
    paymentMethods = paymentMethodsAll.filter(m => m.id === 'razerpay');
  } else if (params?.type === 'checkout') {
    paymentMethods = paymentMethodsAll;
  }


  const handleNavigateBack = () => {
    if (params?.type === 'topup') {
      router.replace('/screens/profile/topup');
    } else if (params?.type === 'checkout') {
      router.replace('/screens/orders/checkout');
    }
  };

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="PAYMENT METHODS" isBackButton={true} navigatePage={handleNavigateBack} />

        <ScrollView
          contentContainerStyle={[styles.container, { paddingHorizontal: 16 }]}
          style={{ marginBottom: 80 }}
        >
          {paymentMethods.map(method => (
            <TouchableOpacity
              key={method.id}
              style={styles.paymentOption}
              onPress={() => handleSelect(method.id)}
              activeOpacity={0.8}
            >
              <View style={styles.tickCircleOuter}>
                {selectedMethod === method.id && <View style={styles.tickCircleInner} />}
              </View>
              {customerData && <Text style={styles.paymentText}>{method.name === "US Pizza Wallet" ? `${method.name} (RM ${customerData?.customer_wallet})` : method.name}</Text>}
              <View style={styles.rightIcons}>
                {method.iconType === 'image' ? (
                  <Image
                    source={method.icon}
                    style={[
                      {
                        width: width <= 360 ? width * 0.25 : width <= 390 ? width * 0.18 : width * 0.15,
                        height: height * 0.035,
                        alignSelf: 'flex-end',
                      }
                    ]}
                    resizeMode="contain"
                  />
                ) : (customerData?.customer_wallet === "0.00" && customerData?.enable_wallet ? (
                  <PolygonButton
                    text="Recharge"
                    width={60}
                    height={22}
                    color="#C2000E"
                    textColor="#fff"
                    textStyle={{ fontSize: 11, fontWeight: 'bold' }}
                    style={{ marginLeft: 6 }}
                    onPress={() => router.push('/screens/profile/topup')}
                  />) : (
                  <Ionicons
                    name={method.icon}
                    size={24}
                    color="#C2000E"
                    style={styles.paymentIcon}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ))}

          {/* Online Payment Services Section - Grouped by Category */}
          {selectedMethod === 'razerpay' && (
            <View style={styles.servicesSection}>
              {razorpayServiceCategories.map((category, idx) => (
                <View key={idx} style={styles.categorySection}>
                  <View style={styles.categoryHeader}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <View style={styles.servicesRow}>
                      {category.services.map((service, sidx) => (
                        <View key={sidx} style={styles.serviceItem}>
                          <Image source={service.image} style={styles.serviceLogo} resizeMode="contain" />
                        </View>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleConfirm}
            disabled={!selectedMethod}
          >
            <CustomTabBarBackground />
            <Text style={[
              styles.confirmButtonText,
              !selectedMethod && styles.disabledButtonText
            ]}>
              CONFIRM
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
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tickCircleOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#C2000E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tickCircleInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#C2000E',
  },
  paymentText: {
    flex: 1,
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#1a1a1a',
    letterSpacing: 0.3,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  paymentIcon: {
    marginRight: 12,
  },
  servicesSection: {
    marginTop: height * 0.01,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  categoryHeader: {
    display: 'flex',
    flexDirection: width < 440 ? 'column' : 'row',
    alignItems: width < 440 ? 'flex-start' : 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 15,
    color: '#C2000E',
    marginRight: 16,
    letterSpacing: 0.5,
    flexShrink: 0,
  },
  servicesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: width < 440 ? 10 : 0,
    marginTop: width < 440 ? 4 : 0,
  },
  serviceItem: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  serviceLogo: {
    width: width < 440 ? 34 : 28,
    height: width < 440 ? 34 : 28,
  },
  serviceName: {
    display: 'none',
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
});