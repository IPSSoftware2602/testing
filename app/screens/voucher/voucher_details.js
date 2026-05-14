import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import React, { useEffect, useState } from 'react';
import useAuthGuard from '../../auth/check_token_expiry';
import TopNavigation from '../../../components/ui/TopNavigation';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';

export default function VoucherDetails() {
  useAuthGuard();
  const router = useRouter();
  const { voucher, from } = useLocalSearchParams(); // 👈 capture `from`
  const [voucherData, setVoucherData] = useState(null);

  useEffect(() => {
    if (voucher) {
      try {
        const parsed = JSON.parse(voucher);
        setVoucherData(parsed);
      } catch (error) {
        console.error('Invalid voucher data:', error);
      }
    }
  }, [voucher]);

  const handleRedeem = () => {
    if (!voucherData) return;
    router.push({
      pathname: '/screens/orders/checkout',
      params: {
        selectedVoucher: JSON.stringify(voucherData),
      },
    });
  };

  const handleBack = () => {
    if (from === 'profile') {
      router.push('/screens/profile/voucher');
    } else {
      router.push('/screens/voucher/select');
    }
  };

  if (!voucherData) {
    return (
      <ResponsiveBackground>
        <SafeAreaView style={styles.container}>
          <TopNavigation
            title="Voucher Details"
            isBackButton={true}
            navigatePage={() => handleBack()}
          />
          <View style={styles.center}>
            <Text>No voucher data found.</Text>
          </View>
        </SafeAreaView>
      </ResponsiveBackground>
    );
  }

  const showRedeemButton = from !== 'profile';

  const isNotYetActive = (() => {
    if (!voucherData?.voucher_start_date) return false;
    try {
      const startDate = new Date(voucherData.voucher_start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return startDate > today;
    } catch (e) {
      return false;
    }
  })();

  const isRedeemDisabled = voucherData.voucher_status !== 'active' || isNotYetActive;

  return (
    <ResponsiveBackground>
      <SafeAreaView style={styles.container}>
        <TopNavigation
          title="Voucher Details"
          isBackButton={true}
          navigatePage={() => handleBack()}
        />

        <ScrollView>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  voucherData.voucher_image_url ||
                  'https://icom.ipsgroup.com.my/backend/uploads/menu_images/6_1760066613_0.jpg',
              }}
              style={styles.image}
            />
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.name}>{voucherData.title}</Text>
            <Text style={styles.voucherCode}>
              Voucher Code: {voucherData.voucher_code}
            </Text>

            {voucherData.voucher_start_date ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Start Date</Text>
                <Text style={styles.sectionContentValidity}>
                  {voucherData.voucher_start_date}
                </Text>
              </View>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Expiry Date</Text>
              <Text style={styles.sectionContentValidity}>
                {voucherData.voucher_expiry_date || 'No expiry date'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionContent}>
                {voucherData.description || 'No description provided.'}
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Terms and Conditions</Text>
              <Text style={styles.sectionContent}>
                {voucherData.voucher_tnc || 'No Terms and Conditions.'}
              </Text>
            </View>
          </View>
        </ScrollView>

        {showRedeemButton && (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={handleRedeem}
              disabled={isRedeemDisabled}
            >
              <CustomTabBarBackground />
              <Text
                style={[
                  styles.confirmButtonText,
                  isRedeemDisabled && styles.disabledButtonText,
                ]}
              >
                {voucherData.voucher_status === 'active' && !isNotYetActive
                  ? 'REDEEM VOUCHER'
                  : 'INACTIVE VOUCHER'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageContainer: { position: 'relative' },
  image: { width: '100%', height: 300 },
  contentContainer: { padding: 20 },
  name: {
    fontSize: 24,
    fontFamily: 'Route159-Regular',
    color: '#C2000E',
    marginBottom: 8,
    textAlign: 'center',
  },
  voucherCode: {
    fontSize: 14,
    fontFamily: 'Route159-Regular',
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
    color: '#555',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: 'Route159-Regular',
    color: '#C2000E',
    lineHeight: 20,
  },
  sectionContentValidity: {
    fontSize: 14,
    fontFamily: 'Route159-Regular',
    color: '#C2000E',
    lineHeight: 20,
  },
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  redeemButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: 'Route159-HeavyItalic',
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
  disabledButtonText: { color: '#ffffffaa' },
});
