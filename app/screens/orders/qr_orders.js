import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import React, { useState, useEffect, useCallback } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl, imageUrl } from '../../constant/constants';
import useAuthGuard from '../../auth/check_token_expiry';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const mapTabtoQuery = {
  all: '',
  active: 'pending',
  past: 'completed',
};

export default function QrOrdersScreen() {
  useAuthGuard();
  const router = useRouter();
  const navigation = useNavigation();
  const { outletId, orderType } = useLocalSearchParams();

  const [activeTab, setActiveTab] = useState('all');
  const [authToken, setAuthToken] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [customerOrder, setCustomerOrder] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [uniqueQrCode, setUniqueQrCode] = useState('');
  const [uniqueQrData, setUniqueQrData] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState(null);

  useEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: { display: 'none' },
    });

    return () => {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: 'flex' },
      });
    };
  }, [navigation]);

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customer = customerJson ? JSON.parse(customerJson) : null;
        const uniqueQrDataStr = await AsyncStorage.getItem('uniqueQrData');
        const uniqueQrData = uniqueQrDataStr ? JSON.parse(uniqueQrDataStr) : null;
        const deliveryAddressStr = await AsyncStorage.getItem('deliveryAddressDetails');
        const deliveryAddress = deliveryAddressStr ? JSON.parse(deliveryAddressStr) : null;

        setAuthToken(token || '');
        setCustomerData(customer);
        setUniqueQrCode(uniqueQrData?.unique_code || '');
        setUniqueQrData(uniqueQrData || null);
        setSelectedDeliveryAddress(deliveryAddress || null);
      } catch (err) {
        console.log(err);
      }
    };

    checkStoredData();
  }, []);

  const getCustomerOrders = useCallback(async () => {
    if (!customerData?.id || !uniqueQrCode) {
      setCustomerOrder([]);
      return;
    }

    const createdDate = customerData.created_at;
    const startDate = createdDate.split(' ')[0];
    const today = new Date().toISOString().split('T')[0];

    try {
      const response = await axios.get(
        `${apiUrl}customer-order-list/${customerData.id}?start_date=${startDate}&end_date=${today}&status=${mapTabtoQuery[activeTab]}&unique_qr_code=${encodeURIComponent(uniqueQrCode)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const orderData = response.data;
      setCustomerOrder(orderData.data || []);
    } catch (err) {
      console.log(err);
    }
  }, [customerData, activeTab, authToken, uniqueQrCode]);

  useEffect(() => {
    getCustomerOrders();
  }, [getCustomerOrders]);

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(`${apiUrl}customers/address/${customerData.id}`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        const addressData = response.data;
        const sortedAddresses = (addressData.data || []).sort((a, b) => b.is_default.localeCompare(a.is_default));
        setAddresses(sortedAddresses);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get(`${apiUrl}outlets2`, {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
        });
        const outletData = response.data;
        setOutlets(outletData.result || []);
      } catch (error) {
        console.error('Error fetching outlets:', error);
      }
    };

    const fetchData = async () => {
      if (!authToken || !customerData?.id) return;

      try {
        await Promise.all([fetchAddresses(), fetchOutlets()]);
      } catch (error) {
        console.error('Error in parallel fetching:', error);
      }
    };

    fetchData();
  }, [authToken, customerData]);

  const getAddress = (addressId) => {
    if (!addresses) return '';
    const addressObj = addresses.find((item) => item.id === addressId);
    if (!addressObj?.address) return '';
    return addressObj.address;
  };

  const getOutlet = (targetOutletId) => {
    if (!outlets) return '';
    const outletObj = outlets.find((item) => item.id === targetOutletId);
    if (!outletObj?.title) return '';
    return outletObj.title;
  };

  const renderEmptyOrder = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No QR order record found.</Text>
      <Text style={styles.emptySubText}>Orders placed from this QR will appear here.</Text>
    </View>
  );

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() =>
        router.push({
          pathname: '/screens/orders/orders_details',
          params: { orderId: item.id, outletId: item.outlet_id, orderType: item.order_type || 'delivery' },
        })
      }
    >
      <View style={styles.statusBar}>
        {item.status === 'pending' ? <Text style={styles.statusText}>Preparing your order</Text> : null}
        {item.status !== 'pending' && item.status !== 'completed' ? <Text style={styles.statusText}>Order is processing</Text> : null}
        {item.status === 'completed' ? <Text style={styles.statusText}>Order has completed</Text> : null}

        <View style={styles.paymentStatusContainer}>
          {item.payment_status === 'paid' ? (
            <View style={[styles.paymentStatus, styles.paidStatus]}>
              <FontAwesome name="check-circle" size={14} color="#28a745" />
              <Text style={[styles.paymentStatusText, styles.paidText]}>Paid</Text>
            </View>
          ) : (
            <View style={[styles.paymentStatus, styles.unpaidStatus]}>
              <FontAwesome name="clock-o" size={14} color="#ffc107" />
              <Text style={[styles.paymentStatusText, styles.unpaidText]}>Unpaid</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.orderInfo}>
        <Text style={styles.orderIdLabel}>
          ID: <Text style={styles.orderId}>{item.order_so}</Text>
        </Text>
        <Text style={styles.orderDate}>{item.created_at}</Text>
      </View>

      <View style={styles.deliveryRow}>
        {item.order_type === 'delivery' ? (
          <FontAwesome6 name="truck" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        ) : item.order_type === 'pickup' ? (
          <FontAwesome6 name="user-circle" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        ) : (
          <FontAwesome6 name="utensils" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        )}

        <View style={{ width: '80%' }}>
          {item.order_type === 'delivery' ? <Text style={styles.deliveryTo}>Deliver To:</Text> : <Text style={styles.deliveryTo}>Order From:</Text>}
          {item.order_type === 'delivery' ? (
            <Text style={styles.deliveryLocation}>{getAddress(item.customer_address_id)}</Text>
          ) : (
            <Text style={styles.deliveryLocation}>{getOutlet(item.outlet_id)}</Text>
          )}
        </View>
        <FontAwesome name="angle-right" size={24} color="#000000" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  const handleBackToMenu = () => {
    router.push({
      pathname: '/screens/menu',
      params: {
        outletId: outletId || '',
        orderType: orderType || 'delivery',
        fromQR: '1',
      },
    });
  };

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="MY ORDER" isBackButton={true} navigatePage={handleBackToMenu} />

        <View style={styles.tabsRow}>
          {TABS.map((tab) => (
            <View
              key={tab.key}
              style={[
                styles.tabContainer,
                {
                  transform: [{ translateY: tab.key === activeTab ? 0 : 3 }],
                },
              ]}
            >
              {tab.key === activeTab ? (
                <PolygonButton
                  text={tab.label}
                  width={90}
                  height={25}
                  color="#C2000E"
                  textColor="#fff"
                  textStyle={{ fontWeight: 'bold', fontSize: 16 }}
                />
              ) : (
                <TouchableOpacity
                  style={{ justifyContent: 'center', alignItems: 'center' }}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.tabBtn, styles.tabBtnInactive]}>{tab.label}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={[commonStyles.container]}>
          <FlatList
            data={customerOrder}
            renderItem={renderOrder}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyOrder}
          />
        </View>
        {uniqueQrData ? (
          <View style={[styles.bottomBar, commonStyles.containerStyle, { justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 }]}>
            <Image
              source={require('../../../assets/images/uspizza-icon.png')}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
            <View style={styles.qrFooterInfo}>
              <Text style={styles.qrFooterName} numberOfLines={1}>
                {uniqueQrData.name || 'QR Order'}
              </Text>
              <Text style={styles.qrFooterAddress} numberOfLines={2}>
                {selectedDeliveryAddress?.address || 'QR Delivery Address'}
              </Text>
            </View>
            {uniqueQrData.logo ? (
              <Image
                source={{ uri: uniqueQrData.logo.startsWith('http') ? uniqueQrData.logo : imageUrl + 'unique_qr/' + uniqueQrData.logo }}
                style={{ width: 60, height: 60, resizeMode: 'contain' }}
              />
            ) : null}
          </View>
        ) : null}
      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    marginTop: 12,
    marginBottom: 12,
    alignSelf: 'center',
  },
  tabBtn: {
    paddingHorizontal: width <= 440 ? (width <= 375 ? (width <= 360 ? 0 : 0) : 32) : 24,
    paddingVertical: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 10) : 12,
    marginRight: width <= 440 ? (width <= 375 ? (width <= 360 ? 8 : 10) : 12) : 2,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 18) : 13) : 18,
    fontFamily: 'Route159-SemiBoldItalic',
    minHeight: 50,
    textAlign: 'center',
  },
  tabContainer: {
    width: 120,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  tabBtnInactive: {
    color: '#B0B0B0',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
    marginHorizontal: 0,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: width === 390 ? 12 : 18,
    marginBottom: width === 390 ? 12 : 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  statusBar: {
    backgroundColor: '#F2F2F2',
    paddingVertical: 12,
    paddingHorizontal: width === 390 ? 14 : 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  statusText: {
    color: '#222',
    fontFamily: 'Route159-SemiBold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 14) : 16,
    textAlign: 'center',
  },
  orderInfo: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 6,
  },
  orderIdLabel: {
    color: '#222',
    fontFamily: 'Route159-Bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 14) : 14) : 16,
    marginBottom: 2,
  },
  orderId: {
    textDecorationLine: 'underline',
    fontFamily: 'Route159-Bold',
  },
  orderDate: {
    color: '#B0B0B0',
    fontFamily: 'Route159-Regular',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 12) : 12) : 16,
    marginBottom: 6,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F2',
    width: '100%',
  },
  deliveryTo: {
    color: '#B0B0B0',
    fontFamily: 'Route159-Regular',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 12) : 12) : 15,
  },
  deliveryLocation: {
    color: '#222',
    fontFamily: 'Route159-Bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 12) : 12) : 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 14) : 25,
    fontFamily: 'Route159-Bold',
    color: '#C2000E',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 14) : 14) : 18,
    fontFamily: 'Route159-Regular',
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidStatus: {
    backgroundColor: '#e8f5e9',
    borderColor: '#a5d6a7',
    borderWidth: 1,
  },
  unpaidStatus: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
    borderWidth: 1,
  },
  paymentStatusText: {
    fontSize: 12,
    fontFamily: 'Route159-Regular',
    marginLeft: 5,
  },
  paidText: {
    color: '#28a745',
  },
  unpaidText: {
    color: '#ffc107',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: width <= 440 ? (width <= 375 ? 6 : 8) : 10,
    justifyContent: 'space-between',
    paddingTop: width <= 440 ? (width <= 375 ? 14 : 10) : 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  qrFooterInfo: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  qrFooterName: {
    color: '#C2000E',
    fontSize: 14,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  qrFooterAddress: {
    color: '#333',
    fontSize: 11,
    fontFamily: 'RobotoSlab-Regular',
    textAlign: 'center',
  },
});
