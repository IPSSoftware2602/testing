import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthGuard from '../../auth/check_token_expiry';
import { useToast } from '../../../hooks/useToast';

export default function GeneralReceipt() {
  useAuthGuard();
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const toast = useToast();


  const calculateItemTotalPrice = (item) => {
    const basePrice = parseFloat(item.unit_price) || 0;
    const optionsTotal = item.options?.reduce((sum, opt) => {
      return sum + parseFloat(opt.price_adjustment || 0);
    }, 0) || 0;

    return (basePrice + optionsTotal) * item.quantity;
  };

  // 🔹 Fetch order details
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const customer_id = await AsyncStorage.getItem('customerData') ? JSON.parse(await AsyncStorage.getItem('customerData')).id : null;

        const res = await axios.get(`${apiUrl}order/${orderId}/${customer_id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        setOrder(res.data.data);
      } catch (err) {
        console.error('Error fetching order:', err);
        Alert.alert('Error', 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  // 🔹 Handle Download PDF - Works on both web and mobile
  const handleDownload = async () => {
  if (!order) return;

  toast.show('Preparing your receipt...', {
    type: 'custom_toast',
    data: { title: '', status: 'success' },
  });

  try {
    setDownloading(true);

    const token = await AsyncStorage.getItem('authToken');
    const customerData = await AsyncStorage.getItem('customerData');
    const customer_id = customerData ? JSON.parse(customerData).id : null;
    const downloadUrl = `${apiUrl}order/pdf/${orderId}/${customer_id}`;

    console.log('Starting PDF download from:', downloadUrl);

    if (Platform.OS === 'web') {
      const isIOSWeb =
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

      if (isIOSWeb) {
        // 🧠 Safari iOS workaround — fetch with headers, then share or open
        const response = await fetch(downloadUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error('Download failed');

        const blob = await response.blob();
        const file = new File([blob], `USPizza_Receipt_${order.order_so}.pdf`, {
          type: 'application/pdf',
        });

        if (navigator.share) {
          // ✅ Use Web Share API if available (iOS 15+)
          await navigator.share({
            title: 'US PIZZA Receipt',
            text: 'Here’s your receipt PDF',
            files: [file],
          });
          toast.show('Receipt Downloaded successfully!', {
            type: 'custom_toast',
            data: { title: '', status: 'success' },
          });
        } else {
          // 🪄 Fallback: open PDF inline
          const reader = new FileReader();
          reader.onloadend = () => {
            const dataUrl = reader.result;
            const newTab = window.open();
            newTab.document.write(
              `<iframe src="${dataUrl}" style="width:100%;height:100%;border:none;"></iframe>`
            );
          };
          reader.readAsDataURL(blob);
          toast.show('Receipt Downloaded successfully!', {
            type: 'custom_toast',
            data: { title: '', status: 'success' },
          });
        }
        return;
      }

      // ✅ Normal browsers (Chrome, Edge, Desktop Safari, etc.)
      const response = await fetch(downloadUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `USPizza_Receipt_${order.order_so}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);

      toast.show('PDF download started.', {
        type: 'custom_toast',
        data: { title: '', status: 'success' },
      });
    } else {
      // ✅ Native Mobile (Expo)
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('Received empty PDF blob');

      // Convert blob → base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // Save file locally
      const orderNumber = order.order_so || 'receipt';
      const fileName = `USPizza_Receipt_${orderNumber}.pdf`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(
        filePath,
        base64.split(',')[1],
        { encoding: FileSystem.EncodingType.Base64 }
      );

      const fileInfo = await FileSystem.getInfoAsync(filePath);
      if (!fileInfo.exists) throw new Error('File was not saved successfully');

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save Receipt PDF',
        });
      } else {
        Alert.alert('Receipt Downloaded!', `Saved as: ${fileName}`, [
          { text: 'OK' },
        ]);
      }
    }
  } catch (err) {
    console.error('PDF download failed:', err);
    Alert.alert('Error', `Failed to download PDF: ${err.message}`);
  } finally {
    setDownloading(false);
  }
};



  // Format currency
  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatOrderType = (orderType) => {
    if (orderType === 'dinein') {
      return 'Dine-in';
    } else if (orderType === 'pickup') {
      return 'Pick up';
    } else if (orderType === 'delivery') {
      return 'Delivery';
    }
  };

  if (loading) {
    return (
      <ResponsiveBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <TopNavigation
            title={<Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E' }}>General Receipt</Text>}
            isBackButton={true}
            navigatePage={() => router.back()}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#C2000E" />
            <Text style={{ marginTop: 10 }}>Loading receipt...</Text>
          </View>
        </SafeAreaView>
      </ResponsiveBackground>
    );
  }

  if (!order) {
    return (
      <ResponsiveBackground>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <TopNavigation
            title={<Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E' }}>Receipt</Text>}
            isBackButton={true}
            navigatePage={() => router.back()}
          />
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Unable to load order details.</Text>
          </View>
        </SafeAreaView>
      </ResponsiveBackground>
    );
  }

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation
          title={<Text style={{ fontFamily: 'Route159-Bold', fontSize: 18, color: '#C2000E' }}>Receipt</Text>}
          isBackButton={true}
          navigatePage={() => router.back()}
        />

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Receipt Preview */}

          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 20,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
              marginBottom: 20,
            }}
          >
            <Text style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#C2000E',
              textAlign: 'center',
              marginBottom: 16
            }}>
              US PIZZA - Official Receipt
            </Text>

            {/* Order Info */}
            <Text style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Order No:</Text> {order.order_so}
            </Text>
            <Text style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Date:</Text> {new Date(order.created_at).toLocaleDateString()}
            </Text>
            <Text style={{ marginBottom: 4 }}>
              <Text style={{ fontWeight: 'bold' }}>Order Type:</Text> {formatOrderType(order.order_type)}
            </Text>

            <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />

            {/* Items */}
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12, color: '#C2000E' }}>
              Items
            </Text>

            {order.items?.map((item, index) => (
              <View key={index} style={{ marginBottom: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                  <Text style={{ fontWeight: 'bold', flex: 1 }}>{item.title}</Text>
                  <Text style={{ fontWeight: 'bold' }}>
                    x{item.quantity} - {formatCurrency(calculateItemTotalPrice(item))}
                  </Text>
                </View>

                {item.options?.map((opt, optIndex) => (
                  <Text key={optIndex} style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
                    • {opt.option_title} ({formatCurrency(opt.price_adjustment)})
                  </Text>
                ))}
                {item.note && (
                  <Text style={{ marginLeft: 8, fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 }}>
                    Note: {item.note}
                  </Text>
                )}
              </View>
            ))}

            <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />

            {/* Totals */}
            <View style={{ marginVertical: 8 }}>
              {/* Subtotal */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>Subtotal</Text>
                <Text>{formatCurrency(order.subtotal_amount)}</Text>
              </View>
              {/* dont display if amount is > 0 */}
              {order.discount_amount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text>Total Discount </Text>
                  <Text>-{formatCurrency(order.discount_amount)}</Text>
                </View>
              )}
              {
                order.taxes && order.taxes.length > 0 ? (
                  order.taxes.map((tax, index) => (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }} key={index}>
                      <Text>Tax Charges ({parseInt(tax.tax_rate)}% {tax.tax_type})</Text>
                      <Text>{formatCurrency(tax.tax_amount)}</Text>
                    </View>
                  ))
                ) : null
              }

              {/* 🔹 Conditionally show Delivery Fee */}
              {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text>Delivery Fee</Text>
                  <Text>{formatCurrency(order.delivery_fee)}</Text>
                </View>
              )}

              {/* Rounding */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>Rounding</Text>
                <Text>{formatCurrency(order.rounding_amount)}</Text>
              </View>

              {/* Total */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 8,
                  paddingTop: 8,
                  borderTopWidth: 1,
                  borderTopColor: '#ddd',
                }}
              >
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                  {formatCurrency(order.grand_total)}
                </Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />

            {/* Payment Info */}
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Payment Method:</Text> <Text style={{ textTransform: 'capitalize' }}>{order.payments?.[0]?.payment_method || 'N/A'}</Text>
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Status:</Text> <Text style={{ textTransform: 'capitalize' }}>{order.payment_status}</Text>
            </Text>

            {/* Footer */}
            <Text style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888', fontStyle: 'italic' }}>
              Thank you for dining with US PIZZA!
            </Text>
          </View>
        </ScrollView>

        {/* Download Button */}
        <View
          style={{
            paddingVertical: 16,
            paddingHorizontal: 20,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderColor: '#eee',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={handleDownload}
            disabled={downloading}
            style={{
              backgroundColor: downloading ? '#ccc' : '#C2000E',
              paddingVertical: 12,
              paddingHorizontal: 40,
              borderRadius: 10,
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>
              {downloading ? 'Downloading PDF...' : 'Download PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ResponsiveBackground>
  );
}