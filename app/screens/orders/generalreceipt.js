import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GeneralReceipt() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // 🔹 Fetch order details
  useEffect(() => {
    if (!orderId) return;
    (async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const res = await axios.get(`${apiUrl}order/${orderId}`, {
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

  // 🔹 HTML Receipt Template for PDF
  const generateReceiptHtml = (order) => `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            color: #333;
            padding: 20px;
            margin: 0;
            line-height: 1.4;
          }
          .receipt-container {
            max-width: 100%;
          }
          h2 {
            text-align: center;
            color: #C2000E;
            margin-bottom: 15px;
          }
          hr {
            border: 0;
            border-top: 1px solid #ddd;
            margin: 15px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #888;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
          }
          td {
            padding: 6px 0;
          }
          .total {
            font-weight: bold;
            font-size: 16px;
            border-top: 1px solid #ddd;
            padding-top: 8px;
          }
          ul {
            margin: 5px 0;
            padding-left: 15px;
          }
          li {
            margin: 2px 0;
            font-size: 12px;
            color: #666;
          }
          .item-row {
            margin-bottom: 12px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <h2>US PIZZA - General Receipt</h2>
          <p><b>Order No:</b> ${order.order_so || 'N/A'}</p>
          <p><b>Date:</b> ${order.created_at ? new Date(order.created_at).toLocaleDateString() : 'N/A'}</p>
          <p><b>Order Type:</b> ${order.order_type || 'N/A'}</p>
          <hr />
          
          <h3>Items</h3>
          ${order.items && order.items.map(
            (item) => `
            <div class="item-row">
              <div><b>${item.title || 'Unknown Item'}</b> x${item.quantity || 1} - RM${item.unit_price ? parseFloat(item.unit_price).toFixed(2) : '0.00'}</div>
              ${item.options && item.options.length > 0 ? `
              <ul>
                ${item.options.map((opt) => `<li>${opt.option_title || ''}</li>`).join('')}
              </ul>
              ` : ''}
            </div>`
          ).join('') || '<div>No items found</div>'}
          
          <hr/>
          <table>
            <tr><td>Subtotal</td><td align="right">RM ${order.subtotal_amount ? parseFloat(order.subtotal_amount).toFixed(2) : '0.00'}</td></tr>
            <tr><td>Rounding</td><td align="right">RM ${order.rounding_amount ? parseFloat(order.rounding_amount).toFixed(2) : '0.00'}</td></tr>
            <tr><td class="total">Total</td><td align="right" class="total">RM ${order.grand_total ? parseFloat(order.grand_total).toFixed(2) : '0.00'}</td></tr>
          </table>
          <hr/>
          
          <p><b>Payment Method:</b> ${order.payments?.[0]?.payment_method || 'N/A'}</p>
          <p><b>Status:</b> ${order.payment_status || 'N/A'}</p>
          <hr/>
          <p><b>Notes:</b> ${order.notes || '-'}</p>
          <div class="footer">Thank you for dining with US PIZZA!</div>
        </div>
      </body>
    </html>
  `;

  // 🔹 Handle Download PDF
  // 🔹 Handle Download PDF (Simpler version)
const handleDownload = async () => {
  if (!order) return;
  
  try {
    setDownloading(true);
    
    const html = generateReceiptHtml(order);
    
    // Generate PDF
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });

    // Create custom filename for sharing
    const orderNumber = order.order_so || 'receipt';
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const customFileName = `USPizza_Receipt_${orderNumber}_${date}.pdf`;
    
    // Share the PDF with custom filename
    const isSharingAvailable = await Sharing.isAvailableAsync();
    if (isSharingAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Save ${customFileName}`,
        UTI: 'com.adobe.pdf'
      });
    } else {
      Alert.alert('Success', 'PDF generated successfully!');
    }
  } catch (err) {
    console.error('PDF generation failed:', err);
    Alert.alert('Error', 'Failed to generate PDF');
  } finally {
    setDownloading(false);
  }
};

  // Format currency
  const formatCurrency = (amount) => {
    return `RM ${parseFloat(amount || 0).toFixed(2)}`;
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
            {/* Header */}
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
            <Text style={{ marginBottom: 16 }}>
              <Text style={{ fontWeight: 'bold' }}>Order Type:</Text> {order.order_type}
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
                    x{item.quantity} - {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                
                {item.options?.map((opt, optIndex) => (
                  <Text key={optIndex} style={{ marginLeft: 8, fontSize: 14, color: '#666' }}>
                    • {opt.option_title}
                  </Text>
                ))}
              </View>
            ))}

            <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />

            {/* Totals */}
            <View style={{ marginVertical: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>Subtotal</Text>
                <Text>{formatCurrency(order.subtotal_amount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text>Rounding</Text>
                <Text>{formatCurrency(order.rounding_amount)}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#ddd' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>Total</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{formatCurrency(order.grand_total)}</Text>
              </View>
            </View>

            <View style={{ height: 1, backgroundColor: '#ddd', marginVertical: 8 }} />

            {/* Payment Info */}
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Payment Method:</Text> {order.payments?.[0]?.payment_method || 'N/A'}
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Status:</Text> {order.payment_status}
            </Text>
            <Text style={{ marginBottom: 6 }}>
              <Text style={{ fontWeight: 'bold' }}>Notes:</Text> {order.notes || '-'}
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
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ResponsiveBackground>
  );
}