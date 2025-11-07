import { Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, Platform, Modal, Dimensions, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import BeansUpgradeIndicator from '../../../components/profile/BeansUpgradeIndicator';
import PolygonButton from '../../../components/ui/PolygonButton';
import QRCodeModal from '../../../components/ui/QRCodeModal';
import TopNavigation from '../../../components/ui/TopNavigation';
import USPizzaLogo from '../../../components/ui/USPizzaLogo';
import { commonStyles, textStyles } from '../../../styles/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import axios from 'axios'
import { imageUrl, apiUrl } from '../../constant/constants';
import useAuthGuard from '../../auth/check_token_expiry';
import useCheckValidOrderType from '../home/check_valid_order_type';

const { width } = Dimensions.get('window');

export default function Profile() {
  useAuthGuard();
  useCheckValidOrderType();
  const [qrValue, setQrValue] = useState(" ");
  const router = useRouter();
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);
  const [logoutVisible, setLogoutVisible] = useState(false);
  // const [nextTierInfo, setNextTierInfo] = useState(null);

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;

        if (!authToken || !customerData) {
          // alert("Invalid login");
          router.push('/screens/auth/login');
        }

        setAuthToken(authToken);
        setCustomerData(customerData);
        setQrValue(customerData.customer_referral_code);
      } catch (err) {
        console.log(err);
      }
    };
    checkStoredData();
  }, [router])

  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}customers/profile/${customerData.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const updatedCustomerData = response.data.data

        await AsyncStorage.setItem(
          'customerData',
          JSON.stringify({
            ...customerData, // Existing data
            ...updatedCustomerData, // New updates
          })
        );

        setCustomerData((prev) => ({
          ...prev,
          ...updatedCustomerData,
        }));

      } catch (err) {
        console.log(err);
      }

    }

    if (authToken && customerData?.id) {
      fetchCustomerProfile();
    }

  }, [router, authToken, customerData?.id])

  const logoutAction = async () => {
    try {
      await AsyncStorage.clear();
      router.push('/screens/auth/login');
    } catch (err) {
      console.log('Logout error:', err);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      setLogoutVisible(true);
    }
    else {
      Alert.alert(
        'Confirm Logout',
        'Are you sure you want to log out?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.clear(); // Clear stored tokens
                router.push('/screens/auth/login'); // Redirect to login
              } catch (err) {
                console.log('Logout error:', err);
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  }

  const services = [
    { label: 'Check In', icon: require('../../../assets/elements/profile/checkin.png'), route: '/screens/profile/checkin' },
    { label: 'VIP Card', icon: require('../../../assets/elements/profile/vipcard.png'), route: '/screens/profile/vipcard' },
    { label: 'Invite', icon: require('../../../assets/elements/profile/invite.png'), route: '/screens/profile/invite' },
    { label: 'Student Card', icon: require('../../../assets/elements/profile/student_card.png'), route: '/screens/profile/student-card' },
    { label: 'Address', icon: require('../../../assets/elements/profile/address.png'), route: '/screens/profile/addresses' },
    { label: 'Voucher', icon: require('../../../assets/elements/profile/invoice.png'), route: '/screens/profile/voucher' },
    { label: 'Service', icon: require('../../../assets/elements/profile/service.png'), route: '/service' },
    { label: 'Suggestion', icon: require('../../../assets/elements/profile/suggestion.png'), route: '/suggestion' },
  ]

  const getVipCardColor = (tierName) => {
    switch (tierName?.toLowerCase()) {
      case "platinum":
        return "#9ea1a3"; // gray for platinum
      case "gold":
        return "#9ea1a3"; // gold yellow
      case "silver":
        return "#C0C0C0"; // silver gray
      default:
        return "#C2000E";
    }
  };

  return (
    // <View style={commonStyles.outerWrapper}>
    //   <View style={commonStyles.contentWrapper}>
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF2E2' }}>
        <TopNavigation title="PROFILES" isBackButton={false} />
        <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>
          {/* Profile Card */}
          <View style={styles.profileCardWrapper}>
            <LinearGradient
              colors={['#E60012', '#fff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0, 0.4]}
              style={styles.profileCard}
            >


              <View style={styles.profileRow}>

                <TouchableOpacity
                  onPress={() => router.push('/screens/profile/edit_profile')}
                // style={[defaultImageStyle, imageStyle]}
                >
                  {customerData && customerData.profile_picture ? (
                    <Image
                      source={{ uri: `${customerData.profile_picture_url}` }}
                      style={styles.avatar}
                    />
                  ) : (
                    <Image
                      source={require('../../../assets/images/uspizza-icon.png')}
                      style={styles.avatar}
                    />
                  )}

                  <TouchableOpacity
                    style={styles.editProfileIcon}
                    onPress={() => router.push('/screens/profile/edit_profile')}
                  >
                    <Entypo name="edit" size={18} color="#C2000E" />
                  </TouchableOpacity>
                </TouchableOpacity>

                <View style={{ flex: 1, marginLeft: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                        Unknown
                      </Text>
                    )}
                    <View style={styles.usPizzaBadge}>
                      <USPizzaLogo width={32} height={20} color={customerData?.customer_tier_color} />
                    </View>
                  </View>
                  <BeansUpgradeIndicator
                    beansNeeded={customerData?.point_needed_for_next_tier}
                    totalBeansForUpgrade={customerData?.next_tier_min_points}
                    nextTierName={customerData?.next_tier}
                    currentTierName={customerData?.customer_tier_name}
                  />
                </View>
                <View style={{ alignItems: 'flex-start', width: '40%' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', width: '100%' }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'column', alignItems: 'flex-start', width: '55%' }}
                      onPress={() => router.push('/screens/profile/points_history')}
                    >
                      <Text style={styles.pointsLabel}>Points</Text>
                      {customerData && customerData.customer_point ? (
                        <Text style={styles.pointsValue}>{parseInt(customerData.customer_point)} Sedap Points</Text>
                      ) : (
                        <Text style={styles.pointsValue}>888 Sedap Points</Text>
                      )}
                    </TouchableOpacity>
                    {Platform.OS === 'web' ? (
                      <div data-testid="recharge-points-button">
                        <PolygonButton
                          text="Exchange"
                          width={60}
                          height={22}
                          color="#C2000E"
                          textColor="#fff"
                          textStyle={styles.memberText2}
                          style={{ marginLeft: 6 }}
                          onPress={() => router.push('(tabs)/market')}
                        />
                      </div>
                    ) : (
                      <PolygonButton
                        text="Exchange"
                        width={60}
                        height={22}
                        color="#C2000E"
                        textColor="#fff"
                        textStyle={styles.memberText2}
                        style={{ marginLeft: 6 }}
                        onPress={() => router.push('(tabs)/market')}
                      />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5, justifyContent: 'space-between', width: '100%' }}>
                    <TouchableOpacity
                      style={{ flexDirection: 'column', width: '55%' }}
                      onPress={() => router.push('/screens/profile/wallet_history')}
                    >
                      <Text style={styles.pointsLabel}>Balances</Text>
                      {customerData && customerData.customer_wallet ? (
                        <Text style={styles.pointsValue}>RM {customerData.customer_wallet}</Text>
                      ) : (
                        <Text style={styles.pointsValue}>RM 666.00</Text>
                      )}
                      {/* <Text style={styles.pointsValue}>RM 666.00</Text> */}
                    </TouchableOpacity>
                    {Platform.OS === 'web' ? (
                    <div data-testid="recharge-balance-button">
                      <PolygonButton
                        text="Recharge"
                        width={60}
                        height={22}
                        color="#C2000E"
                        textColor="#fff"
                        textStyle={styles.memberText2}
                        style={{ marginLeft: 6 }}
                        onPress={() => router.push('/screens/profile/topup')}
                      />
                    </div>
                  ) : (
                    <PolygonButton
                      text="Recharge"
                      width={60}
                      height={22}
                      color="#C2000E"
                      textColor="#fff"
                      textStyle={styles.memberText2}
                      style={{ marginLeft: 6 }}
                      onPress={() => router.push('/screens/profile/topup')}
                    />
                  )}

                  </View>
                </View>
              </View>
            </LinearGradient>
          </View>

          {/* VIP Card */}
          <View style={[styles.vipCard, { backgroundColor: getVipCardColor(customerData?.customer_tier_name) }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <View style={styles.vipCardHeader}>
                <Image source={require('../../../assets/elements/profile/uspizza_chop.png')} style={styles.vipCardLogo} />
                <View style={styles.vipCardContent}>
                  {customerData && customerData.customer_type ? (
                    <Text style={styles.vipCardTitle}>{customerData.customer_type} </Text>
                  ) : (
                    <Text style={styles.vipCardTitle}>Member Card</Text>
                  )}

                  {customerData && customerData.customer_tier_name ? (
                    <Text style={styles.vipCardSubtitle}>{customerData.customer_tier_name} </Text>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity style={{ width: '30%', height: '100%', alignItems: 'flex-end', justifyContent: 'flex-start', padding: 5 }} onPress={() => setQRModalVisible(true)}>
                <QRCode
                  value={qrValue}
                  size={width < 440 ? width < 375 ? 50 : 55 : 60}
                />
              </TouchableOpacity>
            </View>
            <Image source={require('../../../assets/elements/profile/uspizza_card_background.png')} style={styles.vipCardWatermark} />
          </View>

          {/* My Order Button */}
          <TouchableOpacity onPress={() => router.push('(tabs)/orders')}>
            <View style={styles.section}>
              <PolygonButton
                text="MY ORDER"
                width={100}
                height={30}
                style={styles.memberBadge}
                textStyle={styles.memberText}
              />
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
                <Text style={styles.recentOrdersText}>View recent orders</Text>
                <Entypo name="chevron-thin-right" size={24} color="#C2000E" />
              </View>
            </View>
          </TouchableOpacity>

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsGrid}>
            {services.map((item, idx) => (
              // <TouchableOpacity key={idx} style={styles.quickActionItem} onPress={() => router.push('(tabs)')}>
              <TouchableOpacity
                key={idx}
                style={styles.quickActionItem}
                // onPress={() => router.push(item.route)}
                onPress={() => {
                  if (item.label === 'Suggestion') {
                    Linking.openURL('mailto:info@uspizza.my');
                  } else if (item.label === 'Service') {
                    const phone = "60173978341";
                    const message = encodeURIComponent(
                      `Hello US Pizza Customer Service, can you help me?`
                    );
                    const url = `https://wa.me/${phone}?text=${message}`;

                    if (Platform.OS === "web") {
                      window.open(url, '_blank');
                    }
                    else {
                      Linking.openURL(url);
                    }
                  }
                  else {
                    router.push(item.route);
                  }
                }}
              >
                <Image source={item.icon} style={styles.quickActionIcon} />
                <Text style={styles.quickActionLabel}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* { flexDirection: 'row', alignItems: 'center', marginBottom: 10, justifyContent: 'space-between', width: '100%' } */}

          <View style={styles.logoutSection}>
            <PolygonButton
              text="v1.0.0"
              width={80}
              height={20}
              color="#C2000E"
              textColor="#fff"
              style={styles.memberBadge}
              textStyle={{ fontSize: 12 }}
            />

            <PolygonButton
              text="LOG OUT"
              width={120}
              height={25}
              color="#C2000E"
              textColor="#fff"
              style={styles.memberBadge}
              textStyle={{ fontSize: 14 }}
              onPress={handleLogout}
            />
          </View>

        </ScrollView>
        <QRCodeModal
          isVisible={isQRModalVisible}
          onClose={() => setQRModalVisible(false)}
          value={qrValue}
        />

        <ConfirmationModal
          title={"Confirm Logout"}
          subtitle={"Are you sure you want to log out?"}
          confirmationText={"Logout"}
          onCancel={() => setLogoutVisible(false)}
          onConfirm={() => {
            setLogoutVisible(false);
            logoutAction();
          }}
          isVisible={logoutVisible}
        />
      </SafeAreaView >
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({

  profileCard: {
    padding: 16
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 40,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 8,
  },
  usPizzaBadge: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 24,
    fontFamily: 'Route159-SemiBoldItalic',
    marginBottom: 2,
    width: '60%'
  },
  upgradeText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'RobotoSlab-Regular',
    marginTop: 2,
  },
  pointsLabel: {
    color: '#C2000E',
    fontSize: 16,
    fontFamily: 'Route159-Bold',
    marginTop: 2,
  },
  pointsValue: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Route159-SemiBold',
  },
  balanceLabel: {
    color: '#C2000E',
    fontSize: 13,
    fontFamily: 'Route159-Bold',
    marginTop: 2,
  },
  balanceValue: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 15,
    fontFamily: 'Route159-Bold',
  },
  qrCode: {
    width: 38,
    height: 38,
    marginTop: 4,
    marginBottom: 2,
    backgroundColor: '#eee',
    borderRadius: 8,
  },
  qrLabel: {
    color: '#888',
    fontSize: 11,
    fontFamily: 'RobotoSlab-Regular',
  },
  vipCard: {
    backgroundColor: '#C2000E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    padding: 15,
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  vipCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
    width: '70%',
  },
  vipCardContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'center',
    marginLeft: 12,
    width: '80%'
  },
  vipCardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    // fontSize: width > 440 ? 30 : 28,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 24 : 22) : 24) : 30,
    fontFamily: 'Route159-HeavyItalic'
  },
  vipCardSubtitle: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Route159-SemiBoldItalic',
  },
  vipCardLogo: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
  },
  vipCardWatermark: {
    width: '100%',
    height: 60,
    resizeMode: 'contain',
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
    marginBottom: 10,
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
  recentOrdersText: {
    color: '#C2000E',
    fontSize: 12,
    fontFamily: 'Route159-Bold',
  },
  quickActionsGrid: {
    backgroundColor: '#fff',
    borderRadius: 18,
    marginHorizontal: 16,
    padding: 18,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionItem: {
    width: '23%',
    alignItems: 'center',
    marginVertical: 12,
  },
  quickActionIcon: {
    width: 45,
    height: 45,
    marginBottom: 6,
    resizeMode: 'contain',
  },
  quickActionLabel: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 12) : 12) : 14,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
  },
  badgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'Route159-Bold',
  },
  memberBadge: {
    alignSelf: 'center',
    marginBottom: 4,
  },
  memberText: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 14) : 16,
    fontFamily: 'Route159-HeavyItalic',
  },
  logoutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginHorizontal: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 100,
    borderRadius: 8,
    flex: 1,
    // width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    width: Math.min(width, 440) * 0.75,
    height: Math.min(width, 440) * 0.35,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: '10%',
    justifyContent: 'space-between',
    width: '75%'
  },
  cancelBtn: {
    color: '#007AFF',
    fontSize: 19,
    lineHeight: 15,
    fontWeight: 'bold',
    fontFamily: 'RobotoSlab-Bold'
  },
  logoutBtn: {
    color: '#FF3B30',
    fontSize: 19,
    lineHeight: 15,
    fontFamily: 'RobotoSlab-Regular'
  },
  editProfileIcon: {
    position: 'absolute',
    top: -3,
    right: 2,
    zIndex: 5,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 4,
    elevation: 2,
  },
  memberText2: {
    fontSize: width <= 375 ? (width <= 360 ? 11 : 10) : 11,
    fontFamily: 'Route159-HeavyItalic',
    fontWeight: 'bold',
  },
}); 