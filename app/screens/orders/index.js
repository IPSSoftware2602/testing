import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import React, { useState, useEffect, use } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import useAuthGuard from '../../auth/check_token_expiry';
import useCheckValidOrderType from '../home/check_valid_order_type';

const { width } = Dimensions.get('window');

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'past', label: 'Past' },
];

const mapTabtoQuery = {
  "all": "",
  "active": "pending",
  "past": "completed",
}

export default function Orders() {
  useAuthGuard();
  useCheckValidOrderType();
  const [activeTab, setActiveTab] = useState('all');
  const router = useRouter();
  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [customerOrder, setCustomerOrder] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [outlets, setOutlets] = useState([]);

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
    // console.log(customerData);
    getCustomerOrders();
  }, [customerData, activeTab])

  // useEffect(() => {
  //   console.log(customerOrder);
  // }, [customerOrder])

  const getCustomerOrders = async () => {

    if (customerData?.id) {
      const createdDate = customerData.created_at;
      const startDate = createdDate.split(" ")[0];
      const today = new Date().toISOString().split('T')[0];;

      try {
        const response = await axios.get(
          `${apiUrl}customer-order-list/${customerData.id}?start_date=${startDate}&end_date=${today}&status=${mapTabtoQuery[activeTab]}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            }
          });

        const orderData = await response.data;
        setCustomerOrder(orderData.data);

        // console.log(orderData.data);
      } catch (err) {
        console.log(err);
      }
    }
  }

  const renderEmptyOrder = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No order record found.</Text>
      <Text style={styles.emptySubText}>You may place order at Menu.</Text>
    </View>
  );

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}customers/address/${customerData.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const addressData = await response.data;
        // Sort addresses - default first
        const sortedAddresses = addressData.data.sort((a, b) => {
          return b.is_default.localeCompare(a.is_default);
        });

        // console.log("Sorted Addresses:", sortedAddresses);
        setAddresses(sortedAddresses);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}outlets2`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const outletData = await response.data;
        // console.log('123', outletData.result);

        // console.log("Sorted Addresses:", sortedAddresses);
        setOutlets(outletData.result);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    const fetchData = async () => {
      if (!authToken || !customerData?.id) return;

      try {
        await Promise.all([
          fetchAddresses(),
          fetchOutlets()
        ]);
      } catch (error) {
        console.error('Error in parallel fetching:', error);
      }
    };

    if (authToken && customerData) {
      fetchData();
    }
  }, [authToken, customerData]);

  const getAddress = (addressId) => {
    if (!addresses) return '';

    const addressObj = addresses.find(item => item.id === addressId);
    if (!addressObj?.address) return '';
    return addressObj.address;
  }

  const getOutlet = (outletId) => {
    if (!outlets) return '';

    const outletObj = outlets.find(item => item.id === outletId);
    if (!outletObj?.title) return '';

    return outletObj.title;
  }

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderCard} onPress={() => router.push({ pathname: '/screens/orders/orders_details', params: { orderId: item.id } })}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        {item.status === 'pending' ? (<Text style={styles.statusText}>Preparing your order</Text>) : null}
        {item.status !== 'pending' && item.status !== 'completed' ? (<Text style={styles.statusText}>Order is processing</Text>) : null}
        {item.status === 'completed' ? (<Text style={styles.statusText}>Order has completed</Text>) : null}



        {/* Payment Status */}
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
      {/* Order Info */}
      <View style={styles.orderInfo}>
        <Text style={styles.orderIdLabel}>
          ID: <Text style={styles.orderId}>{item.order_so}</Text>
        </Text>
        <Text style={styles.orderDate}>{item.created_at}</Text>
      </View>
      {/* Delivery Info */}
      <View style={styles.deliveryRow}>
        {item.order_type === 'delivery' ? (
          <FontAwesome6 name="truck" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        ) : item.order_type === 'pickup' ? (
          // <FontAwesome6 name="user-circle" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
          <FontAwesome6 name="user-circle" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        ) : (
          // <FontAwesome6 name="user-circle" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
          <FontAwesome6 name="utensils" size={28} color="#B0B0B0" style={{ marginRight: 12 }} />
        )}
        <View style={{ width: '80%' }}>

          {item.order_type === 'delivery' ? (
            <Text style={styles.deliveryTo}>Deliver To:</Text>
          ) : (
            <Text style={styles.deliveryTo}>Order From:</Text>
          )}

          {item.order_type === 'delivery' ? (
            <Text style={styles.deliveryLocation}>{getAddress(item.customer_address_id)}</Text>
          ) : (
            <Text style={styles.deliveryLocation}>{getOutlet(item.outlet_id)}</Text>
          )}

          {/* <Text style={styles.deliveryLocation}>{getAddress(item.customer_address_id)}</Text> */}

        </View>
        <FontAwesome name="angle-right" size={24} color="#000000" style={{ marginLeft: 'auto' }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ResponsiveBackground>
      {/* <View style={commonStyles.outerWrapper}>
     <View style={commonStyles.contentWrapper}> */}
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="MY ORDER" isBackButton={false} />
        {/* Tabs */}
        <View style={styles.tabsRow}>
          {TABS.map(tab => (
            <View
              key={tab.key}
              style={[
                styles.tabContainer,
                {
                  transform: [{ translateY: tab.key === activeTab ? 0 : 3 }], // inactive tabs sit slightly lower
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

        {/* Orders List */}
        <View style={[commonStyles.container, commonStyles.containerStyle]}>
          <FlatList
            data={customerOrder}
            renderItem={renderOrder}
            keyExtractor={item => item.id}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyOrder}
          />
        </View>
      </SafeAreaView>
      {/* </View>
    </View> */}
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  tabBtnWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
    minHeight: 50, // Ensures enough height for the text
    textAlign: 'center', // Centers the text horizontally
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
    width: '100%'
  },
  deliveryIcon: {
    width: 38,
    height: 38,
    marginRight: 12,
    borderRadius: 19,
    backgroundColor: '#F2F2F2',
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
    backgroundColor: '#e8f5e9', // Light green background
    borderColor: '#a5d6a7', // Green border
    borderWidth: 1,
  },
  unpaidStatus: {
    backgroundColor: '#fff3cd', // Light yellow background
    borderColor: '#ffeeba', // Yellow border
    borderWidth: 1,
  },
  paymentStatusText: {
    fontSize: 12,
    fontFamily: 'Route159-Regular',
    marginLeft: 5,
  },
  paidText: {
    color: '#28a745', // Green text
  },
  unpaidText: {
    color: '#ffc107', // Yellow text
  },
}); 