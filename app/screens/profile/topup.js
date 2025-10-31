import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Linking,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { useRouter } from 'expo-router';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import useAuthGuard from '../../auth/check_token_expiry';
import * as WebBrowser from 'expo-web-browser';
import PaymentScreen from '../../../components/ui/PaymentScreen';

const PaymentMethodButton = () => {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = React.useState(null);

  React.useEffect(() => {
    const setDefaultPaymentMethod = async () => {
      try {
        // const stored = await AsyncStorage.getItem('paymentMethod');
        // const customerData = await AsyncStorage.getItem('customerData');
        // const parsedCustomer = JSON.parse(customerData);
        // setCustomerWallet(parsedCustomer?.customer_wallet || "0.00");
        // if (stored) {
        //   setPaymentMethod(stored);
        // } else {
        await AsyncStorage.setItem('paymentMethod', 'razerpay');
        setPaymentMethod('razerpay');
        // }
      } catch (err) {
        console.log(err?.response?.data?.message || err);
      }
    };
    setDefaultPaymentMethod();
  }, []);

  const paymentMethodMap = {
    razerpay: {
      name: 'Online Payment',
      icon: 'card',
    },
  };

  let displayName = 'Select Payment Method';
  let displayIcon = 'wallet';
  if (paymentMethod) {
    try {
      const parsed = JSON.parse(paymentMethod);
      displayName = parsed?.name || 'Select Payment Method';
      displayIcon = parsed?.icon || 'wallet';
    } catch {
      // If not JSON, treat as string key
      if (paymentMethodMap[paymentMethod]) {
        displayName = paymentMethodMap[paymentMethod].name;
        displayIcon = paymentMethodMap[paymentMethod].icon;
      }
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      <TouchableOpacity
        style={styles.paymentMethodButton}
        onPress={() => router.push('/screens/payment/select?type=topup')}
      >
        <View style={styles.paymentMethodContent}>
          <Ionicons
            name={displayIcon}
            size={24}
            color="#C2000E"
            style={styles.paymentMethodIcon}
          />
          <Text style={styles.paymentMethodText}>{displayName}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C2000E" />
      </TouchableOpacity>
    </View>
  );
};

export default function TopupWalletScreen() {
  useAuthGuard();
  const toast = useToast();
  const [manualAmount, setManualAmount] = useState('');
  const [paymentUrl, setPaymentUrl] = useState('');
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const manualAmountInputRef = useRef(null);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(null);
  const [topupPackages, setTopupPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Avoid programmatic focus on mobile web; it can cause horizontal shift/zoom
    if (Platform.OS === 'web') return;

    if (!selectedId) {
      manualAmountInputRef.current?.focus?.();
    } else {
      manualAmountInputRef.current?.blur?.();
    }
  }, [selectedId]);

  // Lock horizontal overflow on web to prevent page shift
  useEffect(() => {
    if (Platform.OS === 'web') {
      const prev = document.body.style.overflowX;
      document.body.style.overflowX = 'hidden';
      return () => {
        document.body.style.overflowX = prev;
      };
    }
  }, []);

  const handleManualAmountChange = (value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');

    if (sanitized === '') {
      setManualAmount('');
      return;
    }

    if (sanitized === '.') {
      setManualAmount('0.');
      return;
    }

    const parts = sanitized.split('.');
    if (parts.length > 2) {
      return;
    }

    if (parts[1] && parts[1].length > 2) {
      return;
    }

    setManualAmount(sanitized);
  };

  useEffect(() => {
    if (!selectedId) {
      manualAmountInputRef.current?.focus?.();
    } else {
      manualAmountInputRef.current?.blur?.();
    }
  }, [selectedId]);

  const handlePaymentModalClose = async () => {
    setShowPaymentScreen(false);
    // const topupId = await AsyncStorage.getItem('topupId');
    router.replace({ pathname: "/screens/payment/loading_payment", params: { type: "topup" } });
  }

  const handleTopup = async () => {
    try {
      await AsyncStorage.removeItem('paymentMethod');

      const token = await AsyncStorage.getItem('authToken') || '';
      const customerStr = await AsyncStorage.getItem('customerData');
      const customer = customerStr ? JSON.parse(customerStr) : null;
      if (!customer) {
        console.log('Missing customer.');
        return;
      }
      let payload = {
        customer_id: customer.id,
        payment_method: 'fiuu',
      };
      if (selectedId) {
        payload.topup_setting_id = selectedId;
      } else if (manualAmount && !isNaN(parseFloat(manualAmount))) {
        payload.topup_setting_id = '';
        payload.other_amount = parseFloat(manualAmount).toFixed(2);
        payload.credit = '0';
      } else {
        toast.show('Please enter a valid top-up amount.', {
          type: 'custom_toast',
          data: { title: '', status: 'error' }
        });
        return;
      }
      const res = await axios.post(`${apiUrl}customer/topup/create`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.data && (res.data.status === 200 || res.data.status === 201)) {

        await AsyncStorage.setItem('topupId', res.data?.data?.id);
        await AsyncStorage.removeItem('paymentMethod');

        const redirectUrl = res.data.redirect_url;
        console.log("Redirect URL:", redirectUrl);
        if (redirectUrl) {
          if (Platform.OS === 'web') {
            // Web solution
            window.location.href = redirectUrl;
          } else {
            setPaymentUrl(redirectUrl);
            setShowPaymentScreen(true);
            return;
          }

          if (Platform.OS !== 'web') {
            const subscription = Linking.addEventListener('url', (event) => {
              // handlePaymentReturn(event.url);
              subscription.remove(); // Cleanup
            });
          }
        } else {
          router.push('/orders');
        }

      } else {
        toast.show('Topup failed.', {
          type: 'custom_toast',
          data: { title: '', status: 'error' }
        });
      }
    } catch (err) {
      console.error('Topup error:', err);
      console.log('Topup error.');
    }
  };
  useEffect(() => {
    const fetchTopupPackages = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken') || '';
        const res = await axios.get(`${apiUrl}topup/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.status === 200 && Array.isArray(res.data.data)) {
          setTopupPackages(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch topup packages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTopupPackages();
  }, []);

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation
          title="TOPUP WALLET"
          isBackButton={true}
          navigatePage={() => router.push('(tabs)/profile')}
        />

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >

        <ScrollView
          style={{ overflow: 'hidden' }} // prevent accidental horizontal scroll on web
          contentContainerStyle={{ paddingBottom: 120, minWidth: '100%' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Topup Amount</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.amountInputRM}>RM</Text>
              {selectedId ? (
                <Text style={styles.amountInputValue}>
                  {(() => {
                    const selected = topupPackages.find(pkg => pkg.id === selectedId);
                    return selected ? parseFloat(selected.topup_amount).toFixed(2) : '0.00';
                  })()}
                </Text>
              ) : (
                <TextInput
                  ref={manualAmountInputRef}
                  style={[styles.amountInputValue, { borderWidth: 0, borderColor: 'transparent', backgroundColor: 'transparent', outlineWidth: 0, outlineColor: 'transparent' }]}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={manualAmount}
                  onChangeText={handleManualAmountChange}
                  maxLength={7}
                />
              )}
            </View>
            <View style={styles.separator} />
            <Text style={styles.amountInputNote}>*Whole amount between RM10 and RM200</Text>

            {loading ? (
              <Text style={{ color: '#888', marginTop: 10 }}>Loading packages...</Text>
            ) : (
              <View style={styles.packageRow}>
                {topupPackages.map((pkg) => {
                  const amt = parseFloat(pkg.topup_amount);
                  const credit = pkg.credit_amount ? parseFloat(pkg.credit_amount) : 0;
                  const isSelected = selectedId === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      style={[styles.packageButton, isSelected && styles.packageButtonSelected]}
                      onPress={() => {
                        if (isSelected) {
                          setSelectedId(null);
                        } else {
                          setSelectedId(pkg.id);
                          setManualAmount('');
                        }
                      }}
                    >
                      <Text style={[styles.packageButtonText, isSelected && styles.packageButtonTextSelected]}>
                        RM{amt}
                      </Text>
                      {credit > 0 && (
                        <Text style={[
                          styles.packageCredit,
                          isSelected && { color: '#fff' }
                        ]}>
                          +RM {credit} Bonus
                        </Text>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {/* Deselect package button */}
                <TouchableOpacity
                  style={[styles.packageButton, !selectedId && styles.packageButtonSelected]}
                  onPress={() => setSelectedId(null)}
                >
                  <Text style={[styles.packageButtonText, !selectedId && styles.packageButtonTextSelected, { fontSize: 14 }]}>Other Amount</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <PaymentMethodButton />

          <View style={styles.separator} />

          {/* Summary Section */}
          <View style={styles.totalsSection}>
            <Text style={styles.TopupSummary}>Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Top-up Amount</Text>
              <Text style={styles.summaryValue}>
                RM {selectedId
                  ? (() => {
                    const selected = topupPackages.find(pkg => pkg.id === selectedId);
                    return selected ? parseFloat(selected.topup_amount).toFixed(2) : '0.00';
                  })()
                  : (manualAmount && !isNaN(parseFloat(manualAmount))
                    ? parseFloat(manualAmount).toFixed(2)
                    : '0.00')}
              </Text>
            </View>
            {selectedId && (() => {
              const selected = topupPackages.find(pkg => pkg.id === selectedId);
              const credit = selected && selected.credit_amount ? parseFloat(selected.credit_amount) : 0;
              return credit > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Bonus Credit</Text>
                  <Text style={styles.summaryValue}>RM {credit.toFixed(2)}</Text>
                </View>
              ) : null;
            })()}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, styles.totalPaymentLabel]}>Total Payment</Text>
              <Text style={[styles.summaryValue, styles.totalPaymentValue]}>
                RM {selectedId
                  ? (() => {
                    const selected = topupPackages.find(pkg => pkg.id === selectedId);
                    return selected ? parseFloat(selected.topup_amount).toFixed(2) : '0.00';
                  })()
                  : (manualAmount && !isNaN(parseFloat(manualAmount))
                    ? parseFloat(manualAmount).toFixed(2)
                    : '0.00')}
              </Text>
            </View>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={{ width: '100%', alignItems: 'center', justifyContent: 'center' }}
            onPress={handleTopup}
          >
            <CustomTabBarBackground />
            <Text style={styles.placeOrderText}>Topup Now</Text>
          </TouchableOpacity>
        </View>

        {showPaymentScreen && (
          <Modal
            visible={showPaymentScreen}
            animationType="slide"
          >
            <PaymentScreen
              url={paymentUrl}
              onClose={() => handlePaymentModalClose()}
            />
          </Modal>
        )}

      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  summaryLabel: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#C2000E',
    opacity: 0.7,
  },
  summaryValue: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#C2000E',
    opacity: 0.7,
  },
  totalPaymentLabel: {
    fontSize: 18,
    opacity: 1,
  },
  totalPaymentValue: {
    fontSize: 18,
    opacity: 1,
  },
  totalRow: {
    flexDirection: 'column', // Change from 'row' to 'column'
    alignItems: 'flex-start', // Align items to the start (left)
    marginBottom: 8,
    gap: 2, // Optional: adds spacing between items (React Native 0.71+)
  },
  TopupSummary: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
  },
  topuptitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    marginBottom: 6,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    marginBottom: 4,
  },
  amountInputRM: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    marginRight: 2,
  },
  amountInputValue: {
    fontFamily: 'Route159-Bold',
    fontSize: 32,
    color: '#C2000E',
    borderColor: '#C2000E',
    backgroundColor: 'transparent',
  },
  amountInputNote: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    marginLeft: 2,
  },
  packageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 8,
    marginTop: 4,
    paddingLeft: 16,
  },
  packageCredit: {
    fontSize: 12,
    color: '#c2000E',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  packageButton: {
    flexBasis: '30%',
    maxWidth: '32%',
    marginRight: '2%',
    marginBottom: 12,
    paddingVertical: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  packageButtonSelected: {
    backgroundColor: '#C2000E',
    borderColor: '#C2000E',
  },
  packageButtonText: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    textAlign: 'center',
  },
  packageButtonTextSelected: {
    color: '#fff',
  },
  paymentMethodButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  paymentMethodContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentMethodIcon: {
    marginRight: 12,
  },
  paymentMethodText: {
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#333',
  },
  grandtotalTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 20,
    color: '#C2000E',
    marginVertical: '2%',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    marginBottom: 6,
    paddingLeft: 4,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#C2000E',
    marginHorizontal: 16,
  },
  totalsSection: {
    padding: 16,
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
