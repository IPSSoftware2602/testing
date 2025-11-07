import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View, Dimensions, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BeansUpgradeIndicator from '../../../components/profile/BeansUpgradeIndicator';
import TopNavigation from '../../../components/ui/TopNavigation';
import USPizzaLogo from '../../../components/ui/USPizzaLogo';
import useAuthGuard from '../../auth/check_token_expiry';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import { useRouter } from 'expo-router';
import NotificationModal from '../../../components/ui/NotificationModal';
// import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';

const { width, height } = Dimensions.get('window');

export default function Checkin() {
  useAuthGuard();
  const router = useRouter();

  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);
  // const [customerPoint, setCustomerPoint] = useState("");
  const toast = useToast();
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationTitle, setNotificationTitle] = useState('');

  const showNotification = (msg, title) => {
    setNotificationMessage(msg);
    setNotificationTitle(title);
    setNotificationVisible(true);
  };

  const [checkinDays, setCheckinDays] = useState([
    { day: 'Day 1', points: 1, checked: false },
    { day: 'Day 2', points: 2, checked: false },
    { day: 'Day 3', points: 3, checked: false },
    { day: 'Day 4', points: 5, checked: false },
    { day: 'Day 5', points: 7, checked: false },
    { day: 'Day 6', points: 8, checked: false },
    { day: 'Day 7', points: 10, checked: false },
  ]);

  const mapCheckinDays = {
    1: "first",
    2: "second",
    3: "third",
    4: "fourth",
    5: "fifth",
    6: "sixth",
    7: "seventh",
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
    const streak = parseInt(customerData?.current_streak);

    for (let i = 0; i < streak; i++) {
      setCheckinDays(prevDays => {
        return prevDays.map((day, index) =>
          index === i ? { ...day, checked: true } : day
        );
      });
    }
  }, [customerData])

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

  useEffect(() => {
    if (authToken && customerData?.id) {
      fetchCustomerProfile();
    }

  }, [router, authToken, customerData?.id])

  const handleCheckIn = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}customer/checkin/${customerData.id}`,
        null,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          }
        });

      const responseData = await response.data;
      // console.log(responseData);
      if (responseData.status === "success") {
        const streak = parseInt(responseData.data.current_streak);

        for (let i = 0; i < streak; i++) {
          setCheckinDays(prevDays => {
            return prevDays.map((day, index) =>
              index === i ? { ...day, checked: true } : day
            );
          });
        }

        toast.show('Yay! See you tomorrow!', {
          type: 'custom_toast',
          data: { title: 'Checked In', status: 'success' }
        });

        showNotification('Yay! See you tomorrow!', 'Checked In');
      }
      fetchCustomerProfile();

    } catch (err) {
      // console.log(err);
      if (err.status === 409) {
        console.log(err.response.data.message); //Already Check In Today

        toast.show('You have already checked in today', {
          type: 'custom_toast',
          data: { title: 'See you tomorrow!', status: 'danger' }
        });
      }
    }
  }

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <TopNavigation title="CHECK-IN" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
        <ScrollView>
          {/* Profile Card */}
          <View style={styles.profileCardWrapper}>
            <LinearGradient
              colors={['#E60012', '#FEF2E2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              locations={[0, 0.4]}
              style={styles.profileCard}
            >
              <View style={styles.profileRow}>
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
                <View style={{ flex: 1, marginLeft: 5 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.name}>
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
                    </Text>
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
                <View style={{ width: '40%', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: 10 }}>
                  <TouchableOpacity style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                    {/* <Text style={styles.pointsLabel}>  */}
                    {customerData?.customer_point ? (
                      <Text style={styles.pointsLabel}>  {customerData?.customer_point}</Text>
                    ) : (
                      <Text style={styles.pointsLabel}>  888</Text>
                    )}
                    {/* </Text> */}
                    <Text style={styles.pointsValue}>Sedap Points</Text>
                  </TouchableOpacity>
                  <Text style={styles.streakText}>{customerData?.checkin_today ? `You have checked in for the ${mapCheckinDays[parseInt(customerData?.current_streak)]} consecutive day` : `Sign in for the ${mapCheckinDays[(parseInt(customerData?.current_streak) + 1)]} consecutive day`}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.checkinCard}>
            <Text style={styles.checkinTitle}>Sign in to earn points</Text>
            <View style={{ marginTop: 8 }}>
              {/* Top row: first 4 days */}
              <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
                {checkinDays.slice(0, 4).map((item, idx) => (
                  <Pressable
                    key={item.day}
                    style={[styles.dayBox, item.checked ? styles.dayBoxChecked : styles.dayBoxUnChecked]}
                    onPress={() => handleCheckIn()}
                    disabled={customerData?.checkin_today}
                  >
                    <Text style={[styles.dayPoints, item.checked ? styles.dayPointsChecked : styles.dayPointsUnChecked]}>+{item.points}</Text>
                    <Image
                      source={require('../../../assets/elements/profile/uspizza_chop.png')}
                      style={[item.checked ? styles.stamp : styles.unstamp]}
                      resizeMode="contain"
                    />
                    <Text style={[styles.dayLabel, item.checked ? styles.dayLabelChecked : styles.dayLabelUnChecked]}>{item.day}</Text>
                  </Pressable>
                ))}
              </View>
              {/* Bottom row: last 3 days */}
              <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 8 }}>
                {checkinDays.slice(4).map((item, idx) => (
                  <TouchableOpacity
                    key={item.day}
                    style={[styles.dayBox2, item.checked ? styles.dayBoxChecked : styles.dayBoxUnChecked]}
                    onPress={() => handleCheckIn()}
                    disabled={customerData?.checkin_today}
                    activeOpacity={1}
                  >
                    <Text style={[styles.dayPoints, item.checked ? styles.dayPointsChecked : styles.dayPointsUnChecked]}>+{item.points}</Text>
                    <Image
                      source={require('../../../assets/elements/profile/uspizza_chop.png')}
                      style={[item.checked ? styles.stamp : styles.unstamp]}
                      resizeMode="contain"
                    />
                    <Text style={[styles.dayLabel, item.checked ? styles.dayLabelChecked : styles.dayLabelUnChecked]}>{item.day}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <NotificationModal
          visible={notificationVisible}
          message={notificationMessage}
          onClose={() => setNotificationVisible(false)}
          title={notificationTitle}
        />
      </SafeAreaView>
    </ResponsiveBackground >
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginTop: '10%',
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
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
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 16) : 18) : 24,
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
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 20 : 20) : 20) : 24,
    fontFamily: 'Route159-HeavyItalic',
    marginTop: 2,
  },
  pointsValue: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Route159-HeavyItalic',
  },
  streakText: {
    color: '#C2000E',
    fontSize: width <= 375 ? (width <= 360 ? 13 : 12) : 16,
    fontFamily: 'Route159-SemiBoldItalic',
    marginTop: 2,
    textAlign: 'right',
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
  },
  vipCardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 30,
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
  checkinCard: {
    backgroundColor: 'white',
    padding: 20,
    alignItems: 'center',
    height: height * 0.5,
  },
  checkinTitle: {
    fontSize: 20,
    fontFamily: 'Route159-HeavyItalic',
    color: '#C2000E',
    marginBottom: 20,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  dayBox: {
    width: '24%',
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 3,
    padding: 6,
    paddingVertical: 12,
    flexDirection: 'column',
  },
  dayBox2: {
    width: '32%',
    height: 180,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 3,
    padding: 6,
    paddingVertical: 12,
    flexDirection: 'column',
  },
  dayBoxChecked: {
    backgroundColor: '#C2000E',
  },
  dayBoxUnChecked: {
    backgroundColor: '#FEF2E2',
  },
  dayPoints: {
    fontSize: 20,
    fontFamily: 'Route159-Heavy',
    marginBottom: 2,
  },
  dayPointsChecked: {
    color: 'white',
  },
  dayPointsUnChecked: {
    color: '#C9CACA',
    fontFamily: 'Route159-Heavy',
  },
  stamp: {
    width: 70,
    height: 70,
    marginVertical: 4,
  },
  unstamp: {
    width: 70,
    height: 70,
    marginVertical: 4,
    tintColor: '#C9CACA',
  },
  dayLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  dayLabelChecked: {
    color: '#FFFFFF',
    fontFamily: 'Route159-Heavy',
  },
  dayLabelUnChecked: {
    color: '#C9CACA',
    fontFamily: 'Route159-Heavy',
  }
}); 