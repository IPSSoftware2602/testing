import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BeansUpgradeIndicator from '../../../components/profile/BeansUpgradeIndicator';
import TopNavigation from '../../../components/ui/TopNavigation';
import USPizzaLogo from '../../../components/ui/USPizzaLogo';
import useAuthGuard from '../../auth/check_token_expiry';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import { useRouter } from 'expo-router';
// // import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
// import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';

const { height } = Dimensions.get('window');
const { width } = Dimensions.get('window');


export default function PointsHistory() {
  useAuthGuard();
  const router = useRouter();
  const [authToken, setAuthToken] = useState("");
  const [customerData, setCustomerData] = useState(null);
  // const [customerPoint, setCustomerPoint] = useState("");
  const [customerPointTransaction, setCustomerPointTransaction] = useState([]);
  // const toast = useToast();

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
    getCustomerPoints();
  }, [customerData])


  const getCustomerPoints = async () => {
    if (customerData?.id) {
      try {
        const response = await axios.get(
          `${apiUrl}customers/point/${customerData?.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            }
          });

        const pointData = await response.data;

        // setCustomerPoint(pointData.data.current_point);
        setCustomerPointTransaction(pointData.data.transactions || []);

        // console.log('Current state transactions:', pointData.data.current_point);
      } catch (err) {
        console.log(err);
      }
    }
  }

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

  const renderEmptyPointsHistory = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
      <Text style={{
        fontSize: 18,
        fontFamily: 'Route159-Bold',
        color: '#C2000E',
        marginBottom: 8,
        textAlign: 'center',
      }}>
        No points history found.
      </Text>
      <Text style={{
        fontSize: 14,
        fontFamily: 'Route159-Regular',
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
      }}>
        You haven&apos;t earned or spent any points yet.
      </Text>
    </View>
  );

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
        <TopNavigation title="POINT HISTORY" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />

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
              {customerData && customerData.profile_picture_url ? (
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
                  currentTierName={customerData?.customer_tier}
                />
              </View>
              <View style={{ width: '40%', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-end', marginTop: 10 }}>
                <TouchableOpacity style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
                  {customerData?.customer_point ? (
                    <Text style={styles.pointsLabel}>{parseInt(customerData?.customer_point)}</Text>
                  ) : (
                    <Text style={styles.pointsLabel}>  888</Text>
                  )}
                  <Text style={styles.pointsValue}>Sedap Points</Text>
                </TouchableOpacity>
                <Text style={styles.streakText}>Points details breakdown</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Points History Section */}
        <View style={styles.checkinCard}>
          <Text style={styles.checkinTitle}>Points History Details</Text>

          {customerPointTransaction.length !== 0 && (
            <View style={styles.tableHeader}>
              <Text style={styles.headerDate}>Date</Text>
              <Text style={styles.headerRemark}>Remark</Text>
              <Text style={styles.headerIn}>In</Text>
              <Text style={styles.headerOut}>Out</Text>
            </View>
          )}

          <FlatList
            data={customerPointTransaction}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            renderItem={({ item: tx, index }) => {
              // console.log('Rendering item:', index, tx);
              return (
                <View style={[
                  styles.tableRow,
                  { backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }
                ]}>
                  <Text style={styles.cellDate}>
                    {tx.created_at?.split(' ')[0] || 'N/A'}
                  </Text>
                  <Text style={styles.cellRemark}>
                    {tx.remark || 'N/A'}
                  </Text>
                  <Text style={styles.cellIn}>
                    {parseFloat(tx.in) > 0 ? `+${tx.in}` : ''}
                  </Text>
                  <Text style={styles.cellOut}>
                    {parseFloat(tx.out) > 0 ? `-${tx.out}` : ''}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={() => {
              // console.log('FlatList is empty, transactions:', customerPointTransaction);
              return renderEmptyPointsHistory();
            }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.flatListContent}
            style={styles.flatList}
          />
        </View>
      </SafeAreaView>
    </ResponsiveBackground>
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
  profileCardWrapper: {
    marginHorizontal: 0,
    marginTop: 8,
    marginBottom: 10,
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
    fontSize: 12,
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
    flex: 1,
    width: '100%',
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
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    width: '100%',
  },
  headerDate: {
    flex: 1.5,
    fontWeight: 'bold',
    color: '#C2000E',
    fontSize: 13,
    paddingLeft: 6,
  },
  headerRemark: {
    flex: 2,
    fontWeight: 'bold',
    color: '#C2000E',
    fontSize: 13,
    paddingRight: 8,
  },
  headerIn: {
    flex: 1,
    fontWeight: 'bold',
    color: '#C2000E',
    fontSize: 13,
    textAlign: 'center',
    paddingRight: 6,
  },
  headerOut: {
    flex: 1,
    fontWeight: 'bold',
    color: '#C2000E',
    fontSize: 13,
    textAlign: 'center',
    paddingRight: 6,
  },
  headerBalance: {
    flex: 1,
    fontWeight: 'bold',
    color: '#C2000E',
    fontSize: 13,
    textAlign: 'center',
    paddingRight: 6,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
    minHeight: 50,
    width: '100%',
    alignSelf: 'stretch',
  },
  cellDate: {
    flex: 1.5,
    color: '#888',
    fontSize: 12,
    paddingLeft: 6,
    fontWeight: '500',
  },
  cellRemark: {
    flex: 2,
    color: '#333',
    fontSize: 12,
    fontWeight: '500',
    paddingRight: 8,
  },
  cellIn: {
    flex: 1,
    color: '#00C851',
    fontSize: 12,
    textAlign: 'center',
    paddingRight: 6,
    fontWeight: '600',
  },
  cellOut: {
    flex: 1,
    color: '#C2000E',
    fontSize: 12,
    textAlign: 'right',
    paddingRight: 6,
    fontWeight: '600',
  },
  cellBalance: {
    flex: 1,
    color: '#333',
    fontSize: 12,
    textAlign: 'center',
    paddingRight: 6,
    fontWeight: '600',
  },
  flatListContent: {
    paddingBottom: 20, // Add some padding at the bottom for the last row
  },
  debugInfo: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 16,
  },
  debugText: {
    fontSize: 12,
    color: '#333',
    marginBottom: 2,
  },
  flatList: {
    width: '100%',
  },
}); 