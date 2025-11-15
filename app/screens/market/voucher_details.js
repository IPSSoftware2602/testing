import { AntDesign } from '@expo/vector-icons';
import { View, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import { imageUrl, apiUrl } from '../../constant/constants';
import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removed useAuthGuard import - voucher details viewing now allowed without login (App Store requirement)
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import { useRouter } from 'expo-router';
import LoginRequiredModal from '../../../components/ui/LoginRequiredModal';


const { width } = Dimensions.get('window');

export default function VoucherDetails() {
  // Removed useAuthGuard - voucher details viewing now allowed without login (App Store requirement)
  const params = useLocalSearchParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const toast = useToast();
  const [voucher, setVoucher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const calculateExpiryDisplay = (voucher) => {
    const type = voucher?.voucher_expiry_type?.toLowerCase();

    if (type === 'date' && voucher.voucher_expired_date) {
      return `Expires on ${new Date(voucher.voucher_expired_date).toLocaleDateString()}`;
    }

    if (type === 'days' && voucher.voucher_expiry_value) {
      const days = parseInt(voucher.voucher_expiry_value);
      if (!isNaN(days)) {
        return `${days} days to redeem after claim`;
      }
    }

    return 'No expired date';
  };

  useEffect(() => {
    const fetchVoucher = async () => {
      try {
        if (!id) {
          setErrorMsg('Voucher not found');
          toast.show('Voucher not found', {
            type: 'custom_toast',
            data: { title: 'Error', status: 'danger' }
          });
          return;
        }
        // Allow voucher details viewing without authentication (App Store requirement)
        const token = await AsyncStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`${apiUrl}/voucher-point/${id}`, {
          headers
        });

        const payload = res?.data?.data;
        const v =
          Array.isArray(payload) ? payload[0] :
            (payload && typeof payload === 'object') ? payload :
              null;

        if (!v) {
          setErrorMsg('Voucher not found');
          toast.show('Voucher not found', {
            type: 'custom_toast',
            data: { title: 'Error', status: 'danger' }
          });
          return;
        }

        v.expiry_display = calculateExpiryDisplay(v);
        setVoucher(v);
      } catch {
        setErrorMsg('Failed to get voucher');
        toast.show('Please try again later', {
          type: 'custom_toast',
          data: { status: 'danger' }
        });
      } finally {
        setLoading(false);
      }
    };
    fetchVoucher();
  }, [id, toast]);

  const handleRedeem = async () => {
    // Check if user is logged in - required for redeeming voucher
    const token = await AsyncStorage.getItem('authToken');
    const customerData = await AsyncStorage.getItem('customerData');
    const customer = customerData ? JSON.parse(customerData) : null;
    
    if (!token || !customer || !customer.id) {
      setShowLoginModal(true);
      return;
    }
    
    if (!voucher?.id) {
      toast.show('Missing voucher info', {
        type: 'custom_toast',
        data: { title: 'Error', status: 'danger' }
      });
      return;
    }
    
  try {
    const res = await axios.post(
      `${apiUrl}voucher/claim`,
      {
        customer_id: customer.id,
        voucher_id: voucher.id,
      },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (res.data.message === 'Voucher already redeemed for this customer') {
      toast.show('You have already redeemed this voucher. Please check your voucher wallet.', {
        type: 'custom_toast',
        data: { title: 'Info', status: 'success' }
      });
    } else if (res.data.status === 200) {
      toast.show('Voucher redeemed successfully!', {
        type: 'custom_toast',
        data: { title: 'Success', status: 'success' }
      });
      setTimeout(() => {
        router.push('/market');
      }, 1000);
    } else {
      toast.show(res.data.message || 'Failed to redeem voucher', {
        type: 'custom_toast',
        data: { title: 'Error', status: 'danger' }
      });
    }
  } catch (err) {
    toast.show(err.response?.data?.message || 'An error occurred', {
      type: 'custom_toast',
      data: { title: 'Error', status: 'danger' }
    });
  }
};

  if (loading) {
    return (
      <ResponsiveBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <TopNavigation title="Voucher Details" isBackButton={true} navigatePage={() => router.push('(tabs)/market')} />
          <ActivityIndicator style={{ marginTop: 24 }} />
        </SafeAreaView>
      </ResponsiveBackground>
    );
  }

  if (errorMsg || !voucher) {
    return (
      <ResponsiveBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <TopNavigation title="Voucher Details" isBackButton={true} navigatePage={() => router.push('(tabs)/market')} />
          <Text style={{ margin: 16, color: '#C2000E' }}>{errorMsg || 'Voucher not found'}</Text>
        </SafeAreaView>
      </ResponsiveBackground>
    );
  }

  const renderTncList = (text) => {
    if (!text) return <Text style={styles.tncText}>No terms and conditions applied.</Text>;

    // Split by newline or numbered patterns
    const lines = text
      .split(/\n|(?=\d+\.)/) // handles both newlines and "1." patterns
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return lines.map((line, index) => (
      <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 6 }}>
        <Text style={styles.tncNumber}>{index + 1}.</Text>
        <Text style={styles.tncText}> {line.replace(/^\d+\.\s*/, '')}</Text>
      </View>
    ));
  };


  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="Voucher Details" isBackButton={true} navigatePage={() => router.push('(tabs)/market')} />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri:
                  voucher?.voucher_image_url && voucher.voucher_image_url !== ''
                    ? voucher.voucher_image_url
                    : voucher?.voucher_image
                      ? `${imageUrl}vouchers/${voucher.voucher_image}`
                      : `${imageUrl}vouchers/1750740068_685a2c64e4c71.jpg`,
              }}
              style={styles.mainImage}
            // https://icom.ipsgroup.com.my/backend/uploads/vouchers/1750740068_685a2c64e4c71.jpg
            // https://icom.ipsgroup.com.my/backend/uploads/vouchers/1750740152_685a2cb830c36.jpg
            />
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E', marginBottom: 6 }}>
              Voucher Name
            </Text>
            <Text style={{ fontSize: 15, color: '#333' }}>
              {voucher?.voucher_name ?? 'No voucher name'}
            </Text>
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E', marginBottom: 6 }}>
              Expiry
            </Text>
            <Text style={{ fontSize: 15, color: '#333' }}>
              {voucher?.expiry_display ?? 'No expiry info'}
            </Text>
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E', marginBottom: 6 }}>
              Voucher Details
            </Text>
            <Text style={{ fontSize: 15, color: '#333' }}>
              {voucher?.voucher_details ?? 'No details'}
            </Text>
          </View>

          <View style={{ marginHorizontal: 16, marginTop: 18 }}>
            <Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E', marginBottom: 6, textAlign: 'left', }}>
              Terms & Conditions
            </Text>
            <View style={{ marginTop: 4 }}>
              {renderTncList(voucher?.voucher_tnc)}
            </View>
          </View>
        </ScrollView>
        <View style={styles.bottomContainer}>
          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
              onPress={handleRedeem}
            >
              <CustomTabBarBackground />
              <Text style={styles.placeOrderText}>
                Redeem Voucher
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <LoginRequiredModal
          isVisible={showLoginModal}
          onConfirm={() => {
            setShowLoginModal(false);
            router.push('/screens/auth/login');
          }}
          onCancel={() => setShowLoginModal(false)}
        />
      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    position: 'relative',
  },
  mainImage: {
    marginHorizontal: 16,
    borderRadius: 12,
    height: 180,
  },
  bottomContainer: {
    position: 'relative',
    marginTop: 20,
    width: '100%',
    backgroundColor: 'transparent',
  },
  bottomBar: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  placeOrderText: {
    fontFamily: 'Route159-HeavyItalic',
    fontSize: 20,
    color: '#fff',
    marginBottom: 20,
  },
});
