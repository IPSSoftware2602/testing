import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';
import QRCodeModal from '../../../components/ui/QRCodeModal';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles, fonts } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FontAwesome6 } from '@expo/vector-icons';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';
import useAuthGuard from '../../auth/check_token_expiry';
import { use } from 'react';

const { width } = Dimensions.get('window');

const benefitList = [
  {
    title: 'Welcome Gift',
    description: 'A mystery surprise when you join!',
    iconName: 'gift',
  },
  {
    title: 'Pizza Party Deals',
    description: '50% OFF all pizzas + 20% OFF snacks & drinks.',
    iconName: 'percent',
  },
  {
    title: 'Birthday Ultra Sedap Points!',
    description: 'Double points on all purchases 1 week before & after your birthday.',
    iconName: 'cake-candles',
  },
  {
    title: 'Quarterly Freebies',
    description: '4 Regular Pizzas on March, June, September & December.',
    iconName: 'pizza-slice',
  },
  {
    title: 'Birthday Treat',
    description: 'Free Lava Cake during your birthday month.',
    iconName: 'cake-candles',
  },
  {
    title: 'Early Access',
    description: 'Be the first to try our new menu, 1 week before everyone else!',
    iconName: 'bolt',
  },
];


export default function VipCard() {
  useAuthGuard();
  // const qrValue = "http://awesome.link.qr"; 
  const [qrValue, setQrValue] = useState(" ");
  const router = useRouter();
  const [isQRModalVisible, setQRModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);

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

  const handleSubscribe = async () => {
    console.log("Subscribed successfully");
    console.log({
      "customer_id": customerData.id
    });
    try {
      const response = await axios.post(
        `${apiUrl}order/vip`,
        {
          "customer_id": customerData.id
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        });
      const responseData = response.data;
      if (responseData.status === 200) {
        const jsonOutletData = JSON.stringify({ outletId: responseData.data.outlet_id, outletTitle: responseData.data.outlet_title, isHQ: true });
        await AsyncStorage.setItem('outletDetails', jsonOutletData);
        // const now = new Date();
        // const yyyy = now.getFullYear();
        // const mm = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        // const dd = String(now.getDate()).padStart(2, '0');
        // const hh = String(now.getHours()).padStart(2, '0');
        // const min = String(now.getMinutes()).padStart(2, '0');

        // const dateStr = `${yyyy}-${mm}-${dd}`;
        // const timeStr = `${hh}:${min}`;
        // await AsyncStorage.setItem('estimatedTime', JSON.stringify({ estimatedTime: "ASAP", date: dateStr, time: timeStr }));
        await AsyncStorage.setItem('estimatedTime', JSON.stringify({ estimatedTime: "ASAP", date: null, time: null }));
        const orderType = responseData.data.order_type;
        await AsyncStorage.setItem('orderType', orderType); // If order_type is a string, this is fine
        router.push({
          pathname: '/screens/orders/checkout',
          params: { vip: 1 }
        });
      }
    } catch (error) {
      console.log(error);
      console.error('Error subscribing to VIP:', error);
    }
  }

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        // const authToken = await AsyncStorage.getItem('authToken');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;

        // setAuthToken(authToken);
        // setCustomerData(customerData);
        setQrValue(customerData.customer_referral_code);
      } catch (err) {
        console.log(err);
      }
    };
    checkStoredData();
  }, [router])

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
        <TopNavigation title="VIP Card" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
        <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>

          {/* VIP Card */}
          <View style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
            <View style={styles.vipCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <View style={styles.vipCardHeader}>
                  <Image source={require('../../../assets/elements/profile/uspizza_chop.png')} style={styles.vipCardLogo} />
                  <View style={styles.vipCardContent}>
                    <Text style={styles.vipCardTitle}>Platinum Card</Text>
                    <Text style={styles.vipCardSubtitle}>VIP</Text>
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
          </View>

          {/* Card Benefit */}
          <View style={styles.cardBenefit}>
            <Text style={styles.benefitTitle}>Be Our VIP – Unlock Ultra Rewards!</Text>
            <Text style={styles.benefitText}>Unlock RM300+ perks for only RM55/year – treat yourself all year long!</Text>
            <View style={{ marginVertical: '1%' }}>
              {benefitList.map((item, index) => (
                <View key={index} style={styles.cardBenefitList}>
                  <View style={styles.iconWrapper}>
                    <FontAwesome6 name={item.iconName} size={30} color="rgb(239, 239, 239)" solid />
                  </View>
                  <View style={styles.benefit}>
                    <Text style={styles.benefitListTitle}>{item.title}</Text>
                    <Text style={styles.benefitListText}>{item.description}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={{ marginTop: '2%' }}>
              <Text style={styles.benefitTextPerk}>All these ultra-sedap rewards for just RM55/year.<br />Don’t miss out—join the Ultra VIP Club today!</Text>

            </View>
          </View>

          <View style={styles.btnWrapper} >
            {customerData?.customer_type ? <CustomPolygonButton
              width={Math.min(width, 440) * 0.35}
              label={(customerData.customer_type).toLowerCase() === 'vip customer' ? "Subscribed" : ((customerData.customer_type).toLowerCase() === 'student' ? "Not available" : "Subscribe")}
              onPress={handleSubscribe}
              disabled={(customerData.customer_type).toLowerCase() === 'vip customer' || (customerData.customer_type).toLowerCase() === 'student'}
            ></CustomPolygonButton> : null}
          </View>

          {/*/ Display note for customer_type = students only */}
          {customerData?.customer_type === 'student' ? 
            <View style={{ textAlign: 'center', alignItems: 'center' }}>
              <Text style={styles.benefitText}>Note*: {((customerData.customer_type).toLowerCase() === 'student' ? "Not available for students" : "")}</Text>
            </View> : null}
        </ScrollView>
        <QRCodeModal
          isVisible={isQRModalVisible}
          onClose={() => setQRModalVisible(false)}
          value={qrValue}
        />
      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  btnWrapper: {
    marginVertical: '5%',
  },
  profileCard: {
    padding: 16
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 40,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
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
    backgroundColor: '#9EA1A3',
    borderRadius: 10,
    marginHorizontal: 16,
    // marginTop: 8,
    // marginBottom: 10,
    marginVertical: '3%',
    padding: 15,
    alignItems: 'flex-start',
    position: 'relative',
    overflow: 'hidden',
  },
  cardBenefit: {
    // marginHorizontal: '5%',
    width: '90%',
    alignSelf: 'center',
    marginTop: '5%',
  },
  cardBenefitList: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: '3%',
    // width: '70%'
    // marginHorizontal: '2%'
  },
  benefitTitle: {
    fontSize: 16,
    fontFamily: 'Route159-Bold',
    color: '#333333',
    marginBottom: '2%',
    textAlign: 'flex-start',
    marginLeft: '1%',
    // width: '80%',
  },
  benefitText: {
    fontSize: 15,
    fontFamily: 'Route159-Regular',
    color: '#333333',
    // marginBottom: '2%',
    textAlign: 'flex-start',
    marginLeft: '1%',
  },
  benefitTextPerk: {
    fontSize: 15,
    fontFamily: 'Route159-Bold',
    color: '#333333',
    // marginBottom: '2%',
    textAlign: 'center',
  },
  benefit: {
    width: '75%',
    marginLeft: '2%'
  },
  benefitListTitle: {
    fontSize: 15,
    fontFamily: 'Route159-Bold',
    color: '#C2000E',
    // color: '#333333',
    marginBottom: '2%',
    textAlign: 'flex-start',
  },
  benefitListText: {
    fontSize: 14,
    fontFamily: 'Route159-Regular',
    color: '#333333',
    marginBottom: '2%',
    textAlign: 'flex-start',
    // width: '95%'
  },
  iconWrapper: {
    width: 65,
    height: 65,
    borderRadius: 35,
    // backgroundColor: 'rgb(228, 226, 226)',
    backgroundColor: '#C2000E',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: '2%',
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
    fontSize: width > 440 ? 30 : 28,
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
    fontSize: 13,
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
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
  },
}); 