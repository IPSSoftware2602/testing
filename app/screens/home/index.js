import { FontAwesome6 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import ImageCarousel from '../../../components/home/ImageCarousel';
import PolygonButton from '../../../components/ui/PolygonButton';
import QRCodeModal from '../../../components/ui/QRCodeModal';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { commonStyles } from '../../../styles/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from '../../../components/ui/NotificationModal';
// import { useRoute } from '@react-navigation/native';
import axios from 'axios'
import { apiUrl } from '../../constant/constants';
// Removed useAuthGuard import - home screen accessible without login (App Store requirement)
import useCheckValidOrderType from '../home/check_valid_order_type';
import LoginRequiredModal from '../../../components/ui/LoginRequiredModal';

const { width } = Dimensions.get('window');

// Dummy assets, replace with your actual asset paths
const dineInIcon = require('../../../assets/elements/home/home_dinein.png');
const pickUpIcon = require('../../../assets/elements/home/home_pickup.png');
const deliverIcon = require('../../../assets/elements/home/home_delivery.png');
const gift = require('../../../assets/elements/home/recharge_gift.png');

// Sample carousel images - replace with your actual promotional images
const carouselImages = [
  require('../../../assets/images/slide1.png'),
  require('../../../assets/images/slide2.png'),
];

export default function HomeScreen() {
  // Removed useAuthGuard - home screen accessible without login (App Store requirement)
  useCheckValidOrderType();
  // const route = useRoute();
  const { showModal, setErrorModal } = useLocalSearchParams();
  // console.log(modalFlag)
  const [orderTypeModalVisible, setOrderTypeModalVisible] = useState(false);
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  //const qrValue = "http://awesome.link.qr"; // You might want to make this dynamic
  const router = useRouter();
  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [qrValue, setQrValue] = useState(" ");
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const lastFetchedCustomerIdRef = useRef(null);

  const showError = (msg, title) => {
    setNotificationMessage(msg);
    setNotificationTitle(title);
    setNotificationVisible(true);
  };

  useEffect(() => {
    if (setErrorModal) {
      showError("This outlet is temporarily unavailable. Please place order with another outlet", "Outlet Unavailable");
    }

  }, [setErrorModal])

  const handleSetOrderType = async (orderType) => {
    try {
      await AsyncStorage.setItem('orderType', orderType);
    }
    catch (err) {
      console.log(err.response.data.message);
    }
  }

  useEffect(() => {
    if (showModal === 'true') {
      setOrderTypeModalVisible(true);
    }
  }, [showModal]);

  useEffect(() => {
    const fetchOutletData = async () => {
      try {
        const outletDetails = await AsyncStorage.getItem('outletDetails');
        if (outletDetails) {
          const parsedOutletDetails = JSON.parse(outletDetails);
          if(parsedOutletDetails.isHQ === true) {
            await AsyncStorage.removeItem('outletDetails');
            await AsyncStorage.removeItem('orderType');
            await AsyncStorage.removeItem('deliveryAddressDetails');
            await AsyncStorage.removeItem('estimatedTime');
            await AsyncStorage.removeItem('paymentMethod');
          }
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    fetchOutletData();
  }, [])

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;

        // Allow home screen to work without login (App Store requirement)
        // Only set data if user is logged in, otherwise leave as null/empty
        if (authToken && customerData) {
          setAuthToken(authToken);
          setCustomerData(customerData);
          setQrValue(customerData.customer_referral_code || " ");

          // Only redirect to register if logged in but name is missing
          if(!customerData?.name) {
            router.push('/screens/auth/register');
          }
        } else {
          // User is not logged in - allow browsing without redirect
          setAuthToken("");
          setCustomerData(null);
          setQrValue(" ");
        }
      } catch (err) {
        console.log(err);
        // On error, allow browsing without login
        setAuthToken("");
        setCustomerData(null);
        setQrValue(" ");
      }
    };

    checkStoredData();
  }, [router])

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      if (!authToken || !customerData?.id) return;
      
      // Prevent duplicate fetches for the same customer ID
      if (lastFetchedCustomerIdRef.current === customerData.id) return;
      
      try {
        const response = await axios.get(
          `${apiUrl}customers/profile/${customerData.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const updatedCustomerData = response.data.data;

        // Get current customerData from state to merge
        setCustomerData((prev) => {
          const mergedData = {
            ...prev,
            ...updatedCustomerData,
          };
          
          // Update AsyncStorage with merged data
          AsyncStorage.setItem('customerData', JSON.stringify(mergedData)).catch(console.error);
          
          // Track that we've fetched for this customer ID
          lastFetchedCustomerIdRef.current = customerData.id;
          
          return mergedData;
        });

      } catch (err) {
        console.log(err);
      }
    };

    fetchCustomerProfile();
  }, [router, authToken, customerData?.id])

  const handleOrderTypeSelect = async (type) => {
    // Delivery method requires login
    if (type === "delivery") {
      const authToken = await AsyncStorage.getItem('authToken');
      const customerData = await AsyncStorage.getItem('customerData');
      
      if (!authToken || !customerData) {
        setOrderTypeModalVisible(false);
        setShowLoginModal(true);
        return;
      }
    }
    
    setOrderTypeModalVisible(false);
    // Clear the showModal parameter when modal is closed
    router.setParams({ showModal: undefined });
    handleSetOrderType(type);
    if (type === "delivery") {
      router.push('/screens/home/address_select');
    }
    else {
      router.push('/screens/home/outlet_select');
    }
  };

  return (
    <SafeAreaView style={commonStyles.outerWrapper}>
      <ResponsiveBackground>
        {/* <View style={commonStyles.contentWrapper}> */}

        <View style={{ flex: 1, backgroundColor: '#FFF6ED' }}>
          <ScrollView
            contentContainerStyle={{
              paddingBottom: Platform.OS === 'android' ? 140 : 120
            }}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
          >
            {/* Hero Section with Carousel */}
            <ImageCarousel
              images={carouselImages}
              height={400}
              autoPlay={true}
              autoPlayInterval={5000}
              dotBottom={100}
            />
            <View style={styles.mainContainer}>
              {/* Welcome Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.hello}>Hello~
                      {customerData && customerData.name ? (
                        <Text
                          style={styles.name}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {customerData.name}
                        </Text>
                      ) : (
                        <Text
                          style={styles.name}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          Guest
                        </Text>
                      )}
                    </Text>
                    <Text style={styles.welcome}><Text style={{ fontWeight: 'bold' }}>Welcome to <Text style={{ color: '#C2000E' }}>USPIZZA</Text></Text></Text>
                  </View>
                  {authToken ? (
                    <PolygonButton
                      text="MEMBER"
                      width={width <= 440 ? (width <= 375 ? (width <= 360 ? 70 : 75) : 90) : 100}
                      height={35}
                      style={styles.memberBadge}
                      textStyle={styles.memberText}
                      onPress={() => router.push('(tabs)/profile')}
                    />
                  ) : (
                    <PolygonButton
                      text="GUEST"
                      width={width <= 440 ? (width <= 375 ? (width <= 360 ? 60 : 65) : 80) : 90}
                      height={35}
                      style={styles.memberBadge}
                      textStyle={styles.memberText}
                      onPress={() => router.push('(tabs)/profile')}
                    />
                  )}
                </View>
                {authToken && (
                  <View style={styles.memberRow}>
                    <View>
                      <Text style={styles.points}>POINT:
                        {/* <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}>888 Sedap Points</Text> */}
                        {customerData && customerData.customer_point ? (
                          <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}> {parseInt(customerData.customer_point)} Sedap Points</Text>
                        ) : (
                          <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}>  888 Sedap Points</Text>
                        )}
                      </Text>
                      <Text style={styles.balance}>BALANCE:
                        {/* <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}>RM 666.00</Text> */}
                        {customerData && customerData.customer_wallet ? (
                          <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}>  RM {customerData.customer_wallet}</Text>
                        ) : (
                          <Text style={{ color: '#C2000E', fontFamily: 'Route159-Bold' }}>  RM 666.00</Text>
                        )}
                      </Text>
                    </View>
                    <TouchableOpacity style={{ width: '30%', height: '100%', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 5 }} onPress={() => setQRModalVisible(true)}>
                      {qrValue && qrValue.trim() !== "" ? (
                        <QRCode
                          value={qrValue.trim()}
                          size={width < 440 ? width < 375 ? 50 : 55 : 60}
                        />
                      ) : (
                        <Text style={{ color: '#C2000E', fontSize: 14 }}>No QR Available</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.orderTypes}>
                  <TouchableOpacity
                    style={styles.orderType}
                    onPress={() => {
                      handleSetOrderType("dinein")
                      router.push('/screens/home/outlet_select')
                    }}>
                    <Image source={dineInIcon} style={styles.orderTypeIcon} />
                    <Text style={styles.orderTypeText}>Dine In</Text>
                  </TouchableOpacity>
                  <View style={[styles.orderTypeDivider]} />
                  <TouchableOpacity
                    style={styles.orderType}
                    onPress={() => {
                      handleSetOrderType("pickup")
                      router.push('/screens/home/outlet_select')
                    }
                    }>
                    <Image source={pickUpIcon} style={styles.orderTypeIcon} />
                    <Text style={styles.orderTypeText}>Pick Up</Text>
                  </TouchableOpacity>
                  <View style={[styles.orderTypeDivider]} />
                  <TouchableOpacity
                    style={styles.orderType}
                    onPress={async () => {
                      // Delivery method requires login
                      const authToken = await AsyncStorage.getItem('authToken');
                      const customerData = await AsyncStorage.getItem('customerData');
                      
                      if (!authToken || !customerData) {
                        setShowLoginModal(true);
                        return;
                      }
                      
                      handleSetOrderType("delivery")
                      router.push('/screens/home/address_select')
                    }
                    }>
                    <Image source={deliverIcon} style={styles.orderTypeIcon} />
                    <Text style={styles.orderTypeText}>Delivery</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Order Section */}
              <TouchableOpacity onPress={() => setOrderTypeModalVisible(true)}>
                <View style={styles.section}>
                  <PolygonButton
                    text="ORDER"
                    width={100}
                    height={30}
                    style={styles.memberBadge}
                    textStyle={styles.memberText2}
                  />
                  <FontAwesome6 name="arrow-right-long" size={24} color="#C2000E" />
                </View>
              </TouchableOpacity>
              {/* Recharge Section */}
              <TouchableOpacity
                style={[styles.section, { margintTop: 5 }]}
                onPress={async () => {
                  // Recharge requires login
                  const authToken = await AsyncStorage.getItem('authToken');
                  const customerData = await AsyncStorage.getItem('customerData');
                  
                  if (!authToken || !customerData) {
                    setShowLoginModal(true);
                    return;
                  }
                  
                  router.push('(tabs)/market');
                }}
              >
                <View style={styles.rechargeContainer}>
                  <Text style={styles.rechargeTitle}>Recharge with gifts</Text>
                  <PolygonButton
                    text="Recharge now"
                    width={120}
                    height={20}
                    textStyle={styles.rechargeBtnText}
                    icon={<FontAwesome6 name="arrow-right-long" size={12} color="#fff" />}
                    onPress={async () => {
                      // Recharge requires login
                      const authToken = await AsyncStorage.getItem('authToken');
                      const customerData = await AsyncStorage.getItem('customerData');
                      
                      if (!authToken || !customerData) {
                        setShowLoginModal(true);
                        return;
                      }
                      
                      router.push('(tabs)/market');
                    }}
                  />
                </View>
                <Image source={gift} style={styles.giftIcon} />
              </TouchableOpacity>
            </View>
          </ScrollView>

          <Modal
            transparent
            visible={orderTypeModalVisible}
            animationType="fade"
            onRequestClose={() => {
              setOrderTypeModalVisible(false);
              // Clear the showModal parameter when modal is closed
              router.setParams({ showModal: undefined });
            }}
          >
            <View style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)'
            }}>
              <View style={{
                backgroundColor: '#fff',
                borderRadius: 18,
                paddingVertical: 32,
                paddingHorizontal: 0,
                width: Math.min(width * 0.85, 360),
                alignItems: 'center',
              }}>
                <TouchableOpacity
                  style={{
                    position: "absolute",
                    top: 3,
                    right: 16,
                    zIndex: 2,
                    padding: 4,
                  }}
                  onPress={() => {
                    setOrderTypeModalVisible(false);
                    // Clear the showModal parameter when modal is closed
                    router.setParams({ showModal: undefined });
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 26, color: "#999", fontWeight: "bold" }}>
                    ×
                  </Text>
                </TouchableOpacity>
                <Text style={{
                  fontWeight: 'bold',
                  fontSize: 20,
                  marginBottom: 30,
                  textAlign: 'center',
                  color: '#C2000E',
                  fontFamily: 'Route159-SemiBoldItalic',
                }}>
                  How would you like to{'\n'}get your order?
                </Text>

                {/* --- Dine In Card --- */}
                <TouchableOpacity
                  style={styles.modalCard}
                  onPress={() => handleOrderTypeSelect('dinein')}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalCardLeft}>
                    <Image source={dineInIcon} style={styles.modalCardIcon} />
                  </View>
                  <View style={styles.modalCardRight}>
                    <Text style={styles.modalCardText}>DINE IN</Text>
                  </View>
                </TouchableOpacity>

                {/* --- Self Pickup Card --- */}
                <TouchableOpacity
                  style={[styles.modalCard, { marginTop: 20 }]}
                  onPress={() => handleOrderTypeSelect('pickup')}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalCardLeft}>
                    <Image source={pickUpIcon} style={styles.modalCardIcon} />
                  </View>
                  <View style={styles.modalCardRight}>
                    <Text style={styles.modalCardText}>SELF PICKUP</Text>
                  </View>
                </TouchableOpacity>

                {/* --- delivery Card --- */}
                <TouchableOpacity
                  style={[styles.modalCard, { marginTop: 20 }]}
                  onPress={() => handleOrderTypeSelect('delivery')}
                  activeOpacity={0.8}
                >
                  <View style={styles.modalCardLeft}>
                    <Image source={deliverIcon} style={styles.modalCardIcon} />
                  </View>
                  <View style={styles.modalCardRight}>
                    <Text style={styles.modalCardText}>DELIVERY</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <NotificationModal
            visible={notificationVisible}
            message={notificationMessage}
            onClose={() => setNotificationVisible(false)}
            title={notificationTitle}
          />

          <QRCodeModal
            isVisible={isQRModalVisible}
            onClose={() => setQRModalVisible(false)}
            value={qrValue}
          />

          <LoginRequiredModal
            isVisible={showLoginModal}
            onConfirm={() => {
              setShowLoginModal(false);
              router.push('/screens/auth/login');
            }}
            onCancel={() => setShowLoginModal(false)}
          />
        </View>

        {/* </View> */}
        {/* </View> */}
      </ResponsiveBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    transform: [{ translateY: -100 }],
    flex: 1,
    paddingBottom: Platform.OS === 'android' ? 2 : 2, // Extra padding for Android
  },
  safeArea: {
    flex: 1,
    // ...(Platform.OS === 'web' && width > 440
    //   ? { width: '100%', maxWidth: 440 }
    //   : { width: '100%' }),
    width: Math.min(width, 440),
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 18,
    margin: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hello: {
    fontSize: 18,
    color: '#C2000E',
    marginBottom: 2,
    fontFamily: 'Route159-SemiBoldItalic',
  },
  welcome: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 22 : 20) : 18) : 24,
    color: '#C2000E',
    marginBottom: 10,
    fontFamily: 'Route159-HeavyItalic',
  },
  memberRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberBadge: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  memberText: {
    fontSize: width <= 375 ? (width <= 360 ? 14 : 13) : 16,
    fontFamily: 'Route159-HeavyItalic',
  },
  memberText2: {
    fontSize: width <= 375 ? (width <= 360 ? 16 : 14) : 16,
    // fontSize: width <= 360 ? 13 : width <= 375 ? 14 : width <= 390 ? 14 : 16, 
    fontFamily: 'Route159-HeavyItalic',
  },
  points: {
    fontSize: 15,
    color: '#222',
    fontFamily: 'RobotoSlab-Regular',
  },
  balance: {
    fontSize: 15,
    color: '#222',
    fontFamily: 'RobotoSlab-Regular',
  },
  qr: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  divider: {
    height: 0.5,
    backgroundColor: '#C2000E',
    marginVertical: 10,
  },
  orderTypes: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  orderType: {
    alignItems: 'center',
    flex: 1,
  },
  orderTypeIcon: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  orderTypeText: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'Route159-Heavy',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2000E',
    fontFamily: 'RobotoSlab-Bold',
  },
  sectionArrow: {
    fontSize: 22,
    color: '#C2000E',
    fontWeight: 'bold',
  },
  pizzaDealsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
  },
  pizzaDeal: {
    flex: 1,
    backgroundColor: '#FFF4E1',
    borderRadius: 12,
    alignItems: 'center',
    position: 'relative',
  },
  pizzaDealImg: {
    width: '100%',
    height: 140,
    resizeMode: 'contain',
  },
  dealBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#C2000E',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dealBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Bold',
  },
  rechargeContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  rechargeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#C2000E',
    marginBottom: 8,
    fontFamily: 'Route159-HeavyItalic',
  },
  rechargeBtnText: {
    fontSize: 12
  },
  giftIcon: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#C2000E',
    height: 70,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    width: 28,
    height: 28,
    resizeMode: 'contain',
    marginBottom: 2,
  },
  navText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
  },
  navTextActive: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold',
    textDecorationLine: 'underline',
  },
  orderTypeDivider: {
    backgroundColor: '#C2000E',
    height: '80%',
    width: 0.3,
  },
  orderModalButton: {
    width: '100%',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orderTypeModalIcon: {
    width: 28,
    height: 28,
    marginRight: 14,
    resizeMode: 'contain',
  },
  modalCard: {
    flexDirection: 'row',
    backgroundColor: '#e3e3e3',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  modalCardLeft: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCardIcon: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  modalCardRight: {
    flex: 1,
    justifyContent: 'center',
  },
  modalCardText: {
    fontSize: 22,
    color: '#C2000E',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    fontFamily: 'Route159-HeavyItalic',
  },
});