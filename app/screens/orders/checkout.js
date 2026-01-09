// screens/orders/checkout.js
'use client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Linking,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import MapView from '../../../components/order/MapView';
import { WebView } from 'react-native-webview';
// import OrderProgressBar from '../../../components/order/OrderProgressBar';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
// import PolygonButton from '../../../components/ui/PolygonButton';
import PaymentScreen from '../../../components/ui/PaymentScreen';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import axios from 'axios'
import { apiUrl, imageUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';
import useAuthGuard from '../../auth/check_token_expiry';
import CustomDateTimePickerModal from '../../../components/ui/CustomDateTimePickerModal';
import { FontAwesome6 } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Modal } from 'react-native';

const { width } = Dimensions.get('window');


//all item has thesame chance of showing 
//fisher yates shuffle algorithm
function getRandomItems(arr, count) {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
  }
  return shuffled.slice(0, count);
}

const voucherHasFreeItems = (voucher) => {
  if (!voucher) return false;

  if (voucher?.promo_settings?.promo_type === 'free_item') return true;

  if (Array.isArray(voucher.free_items) && voucher.free_items.length > 0) return true;
  if (voucher.free_items && typeof voucher.free_items === 'object') {
    const flattened = Object.values(voucher.free_items).flat();
    if (flattened.length > 0) return true;
  }

  return false;
};


const PaymentMethodButton = ({ selectedMethod, navigation, walletBalance, enableWallet }) => {
  const router = useRouter();
  let paymentMethods = {
    wallet: { name: `US Pizza Balance (RM ${walletBalance})`, icon: 'wallet' },
    razerpay: { name: 'Online Payment', icon: 'card' }
  };
  if (!enableWallet) {
    paymentMethods = {
      razerpay: { name: 'Online Payment', icon: 'card' }
    };
  }

  let currentMethod = selectedMethod ? paymentMethods[selectedMethod] : paymentMethods["razerpay"];
  if (!enableWallet) {
    currentMethod = paymentMethods["razerpay"];
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Methods</Text>
      <TouchableOpacity
        style={styles.paymentMethodButton}
        onPress={() => router.push('/screens/payment/select?type=checkout')}
      >
        <View style={styles.paymentMethodContent}>
          <Ionicons
            name={currentMethod.icon}
            size={24}
            color="#C2000E"
            style={styles.paymentMethodIcon}
          />
          <Text style={styles.paymentMethodText}>{currentMethod.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#C2000E" />
      </TouchableOpacity>
    </View>
  );
};

const formatOrderTimeSlot = (orderType, timeEstimate) => {
  // const timeEstimate = "ASAP (25 - 40 mins)";

  switch (orderType) {
    case "delivery":
      return `Estimated Arrival: ${timeEstimate}`;
    case "pickup":
      return `Ready for Pickup: ${timeEstimate}`;
    case "dinein":
      return `Estimated Ready: ${timeEstimate}`;
    default:
      return `Ready: ${timeEstimate}`;
  }
}

const AddressCard = ({ orderType, address, timeEstimate, setShowDateTimePicker }) => {
  return (
    <View style={styles.addressCard}>
      <View style={styles.addressCardHeader}>
        <Feather name="map-pin" size={20} color="#C2000E" />
        <Text style={styles.addressCardTitle}>{orderType && orderType === "delivery" ? "Delivery Address" : "Your Order From: "}</Text>
      </View>
      <View style={styles.addressCardBody}>
        <Text style={styles.addressText}>
          {address ? address : "No.10, Pusat Teknologi Sinar Meranti, 3, Jalan IMP 1"}
        </Text>
      </View>
      {orderType === 'dinein' ?
        <View style={styles.addressCardFooter}>
          <View style={{ flexDirection: "row" }}>
            <Text style={styles.changeAddressText}>{formatOrderTimeSlot(orderType, timeEstimate)}</Text>
          </View>
        </View> :
        <View style={styles.addressCardFooter}>
          <TouchableOpacity
            style={styles.changeAddressButton}
            onPress={() => setShowDateTimePicker(true)}
          >
            <View style={{ flexDirection: "row" }}>
              <Text style={styles.changeAddressText}>{formatOrderTimeSlot(orderType, timeEstimate)}</Text>
              <FontAwesome6
                name={"edit"}
                size={14}
                color={'#C2000E'}
                solid
                style={{ marginLeft: 3 }}
              />
            </View>
          </TouchableOpacity>
        </View>}
      {/* Decorative elements
      <View style={styles.addressCardDecoration1} />
      <View style={styles.addressCardDecoration2} /> */}
    </View>
  );
};

// const pointA = { latitude: 3.1390, longitude: 101.6869 };
// const pointB = { latitude: 3.1520, longitude: 101.7000 };

// Separate component for map section to prevent re-renders
const MapSection = React.memo(({ driverPos, pointA, pointB, mapRef }) => {
  return (
    <View style={styles.mapContainer}>
      <Text style={styles.etaText}>
        Expected to arrive at{' '}
        <Text
          style={{
            color: '#C2000E',
            fontFamily: 'Route159-Heavy',
            fontSize: 22,
          }}
        >
          12:50~1:20
        </Text>
      </Text>
      <Suspense fallback={<Text>Loading map…</Text>}>
        {Platform.OS === 'web' ? (
          <MapView
            driverPos={driverPos}
            pointA={pointA}
            pointB={pointB}
            styles={styles}
          />
        ) : (
          <MapView
            driverPos={driverPos}
            pointA={pointA}
            pointB={pointB}
            mapRef={mapRef}
            styles={styles}
          />
        )}
      </Suspense>
    </View>
  );
});
MapSection.displayName = 'MapSection';

// Memoized order item component
const OrderItem = React.memo(({ item, toast, onItemDeleted, customerId, setShowDeleteModal, setDeleteItem, confirmDelete, vip }) => {
  const router = useRouter();
  const handleEdit = (item) => {
    router.push({
      pathname: '/screens/menu/menu_item',
      params: {
        id: item.id,
        source: 'edit',
        cart_item_id: item.cart_item_id,
        is_free_item: item.is_free_item,
        amount: item.is_free_item ? item.max_quantity : null,
      },
    });
  };

  const handleDelete = (item) => {
    if (Platform.OS === 'web') {
      setDeleteItem(item);
      setShowDeleteModal(true);
    }
    else {
      Alert.alert(
        'Delete Confirmation',
        'Are you sure you want to delete this item?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => confirmDelete(item),
          },
        ],
        { cancelable: true }
      );
    }
  }

  return (
    <View style={styles.orderItem}>
      <Image source={{ uri: item.image }} style={styles.orderItemImage} />
      <View style={styles.orderItemDetails}>
        {/* Top Section: Name and EDIT button */}
        <View style={styles.orderItemTop}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text
              style={styles.orderItemName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.name}
            </Text>
            {item.variation ? (
              <Text style={styles.itemOption}>{item.variation.title}</Text>
            ) : null}
          </View>
          {vip || item.is_free_item === '1' ? null : (
            <TouchableOpacity onPress={() => handleEdit(item)}>
              <Text style={styles.orderItemEdit}>EDIT</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Middle Section: Price */}
        <View style={{ marginVertical: 4 }}>
          {item.is_free_item === '1' ? (
            <Text style={styles.itemOption}>Free Item</Text>
          ) : (
            <View style={styles.orderItemPriceContainer}>
              {item.originalPrice ? (
                <Text style={styles.orderItemOriginalPrice}>
                  RM {item.originalPrice.toFixed(2)}
                </Text>
              ) : null}
              <Text style={styles.orderItemPrice}>
                RM {item.price.toFixed(2)}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Section: Quantity, Options, and Delete */}
        <View style={styles.orderItemBottom}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemQuantity}>Qty : {item.quantity}</Text>
            {item.options && item.options.length > 0 ? (
              item.options.length === 1 ? (
                <Text key={0} style={styles.itemOption}>
                  + {item.options[0].option_title} {item.options[0].price_adjustment ? `RM ${item.options[0].price_adjustment}` : ''}
                </Text>
              ) : (
                <Text style={styles.itemOption}>
                  + {item.options.length} option(s)
                </Text>
              )
            ) : null}
            {item.note && (item.note != '' || item.note != null) ? (
              <View style={styles.noteBadge}>
                <Text style={styles.noteText}>Note: {item.note}</Text>
              </View>
            ) : null}
          </View>
          {vip || item.is_free_item === '1' ? null : (
            <TouchableOpacity
              onPress={() => {
                handleDelete(item);
              }}
              style={{ padding: 4 }} // Added padding for better touch area
            >
              <Feather name="trash-2" size={20} color="#C2000E" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
});
OrderItem.displayName = 'OrderItem';

// Memoized popular item component
const PopularItemCard = React.memo(({ item, handleAddToCart }) => (
  <View style={styles.popularItemCard}>
    <Image
      source={{ uri: item.image }}
      style={styles.popularItemImage}
    />
    <Text style={styles.popularItemName}>{item.name}</Text>
    <View style={styles.popularItemPriceRow}>
      {item.originalPrice ? (
        <Text style={styles.popularItemOriginalPrice}>
          RM {item.originalPrice.toFixed(2)}
        </Text>
      ) : null}
      <Text style={styles.popularItemPrice}>
        RM {item.price.toFixed(2)}
      </Text>
    </View>
    <TouchableOpacity style={styles.popularItemAddButton} onPress={() => handleAddToCart(item)}>
      <AntDesign name="plus" size={16} color="#C2000E" />
    </TouchableOpacity>
  </View>
));
PopularItemCard.displayName = 'PopularItemCard';

export default function CheckoutScreen({ navigation }) {
  useAuthGuard();
  const [customerId, setCustomerId] = useState(null);

  const [cartData, setCartData] = useState(null);

  const [token, setToken] = useState('');
  const [customerData, setCustomerData] = useState({});
  const router = useRouter();
  const toast = useToast();
  const [paymentMethod, setPaymentMethod] = useState("razerpay");
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherId, setVoucherId] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const { selectedVoucher } = useLocalSearchParams();
  const hasAppliedPromo = useRef(false);
  const [voucherToApply, setVoucherToApply] = useState(null);
  const [orderType, setOrderType] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState({});
  const [deliveryAddress, setDeliveryAddress] = useState({});
  const [estimatedTime, setEstimatedtime] = useState({});
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(null);
  const [showFreeItemsModal, setShowFreeItemsModal] = useState(false);
  const [freeItems, setFreeItems] = useState([]);
  const [applyingVoucher, setApplyingVoucher] = useState(false);
  const [selectedFreeItemId, setSelectedFreeItemId] = useState(null);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [voucherToast, setVoucherToast] = useState(true);
  const [promoSettings, setPromoSettings] = useState(null);
  const [freeItemMaxQty, setFreeItemMaxQty] = useState(null);
  const [pendingVoucherData, setPendingVoucherData] = useState(null);
  const [showVoucherConfirmModal, setShowVoucherConfirmModal] = useState(false);
  const [queuedSelectedVoucherJSON, setQueuedSelectedVoucherJSON] = useState(null);
  const [loadingCount, setLoadingCount] = useState(0);
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);

  const showLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
  }, []);

  const hideLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(prev - 1, 0));
  }, []);

  const runWithLoading = useCallback(
    async (fn) => {
      showLoading();
      try {
        return await fn();
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  const isLoading = loadingCount > 0;


  const { vip } = useLocalSearchParams();

  useEffect(() => {
    AsyncStorage.getItem("freeItemMaxQuantity").then((val) => {
      if (val) setFreeItemMaxQty(Number(val));
    });
  }, []);

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      try {
        const paymentMethod = await AsyncStorage.getItem('paymentMethod');
        // console.log(paymentMethod);
        if (paymentMethod) {
          setPaymentMethod(paymentMethod);
        }
        else {
          await AsyncStorage.setItem('paymentMethod', "razerpay");
          setPaymentMethod("razerpay");
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    const fetchCustomerData = async () => {
      try {
        const customerData = await AsyncStorage.getItem('customerData');
        // console.log(paymentMethod);
        if (customerData) {
          setCustomerData(JSON.parse(customerData));
        }

      } catch (err) {
        console.log(err.response.data.message);
      }
    }

    const fetchOrderType = async () => {
      try {
        const orderType = await AsyncStorage.getItem('orderType');
        // console.log(orderType);
        setOrderType(orderType);
      } catch (err) {
        console.log(err.response.data.message);
      }
    }

    const fetchDeliveryAddressData = async () => {
      try {
        const deliveryAddress = await AsyncStorage.getItem('deliveryAddressDetails');
        if (deliveryAddress) {
          const parsedDeliveryAddress = JSON.parse(deliveryAddress);
          // console.log(parsedDeliveryAddress);
          setDeliveryAddress(parsedDeliveryAddress);
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }

    const fetchOutletData = async () => {
      try {
        const outletDetails = await AsyncStorage.getItem('outletDetails');
        if (outletDetails) {
          const parsedOutletDetails = JSON.parse(outletDetails);
          // console.log(parsedOutletDetails);
          setSelectedOutlet(parsedOutletDetails);
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }

    const fetchEstimatedTime = async () => {
      try {
        const estimatedTime = await AsyncStorage.getItem('estimatedTime');
        if (estimatedTime) {
          const parsedETADetails = JSON.parse(estimatedTime);
          // console.log(parsedETADetails);
          setSelectedDateTime(parsedETADetails.estimatedTime);
          setEstimatedtime(parsedETADetails);
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    fetchCustomerData();
    fetchOutletData();
    fetchDeliveryAddressData();
    fetchOrderType();
    fetchEstimatedTime();
    fetchPaymentMethod();
  }, [router, selectedDateTime])


  useEffect(() => {
    AsyncStorage.getItem('customerData').then((customerStr) => {
      if (customerStr) {
        try {
          const customerObj = JSON.parse(customerStr);
          setCustomerId(customerObj.id);
        } catch (err) {
          console.error('Failed to parse customer from AsyncStorage:', err);
        }
      }
    });
  }, []);

  const preCheckVoucherType = async (voucherId, voucherCode) => {
    if (!customerId || !cartData?.id || !cartData?.outlet_id || !orderType) {
      // console.log('🔒 preCheckVoucherType blocked — missing prereqs');
      return false;
    }

    return runWithLoading(async () => {
      const token = (await AsyncStorage.getItem('authToken')) || '';

      try {
        const res = await axios.post(
          `${apiUrl}redeem-voucher/${customerId}`,
          {
            promo_code: voucherId ? '' : (voucherCode || '').trim(),
            voucher_id: voucherId || '',
            cart_id: parseInt(cartData.id),
            outlet_id: parseInt(cartData.outlet_id),
            order_type: orderType
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const data = res.data?.data || {};
        const hasFreeItems =
          (Array.isArray(data.free_items) && data.free_items.length > 0) ||
          data?.promo_settings?.promo_type === 'free_item';

        if (hasFreeItems) {
          await handleRemoveVoucher(); // cleanup dry run
        }

        return hasFreeItems;
      } catch (err) {
        console.warn('⚠️ Voucher pre-check failed:', err?.response?.data || err.message);
        return false;
      }
    });
  };

  const processSelectedVoucher = useCallback(async (selectedVoucherJSON) => {
    try {
      const parsedVoucher = JSON.parse(selectedVoucherJSON);
      const code = parsedVoucher.voucher_code || '';
      const triggerToken = code || String(parsedVoucher.id ?? '');

      setVoucherCode(code);
      setVoucherId(parsedVoucher.id ?? '');
      hasAppliedPromo.current = false;

      if (!customerId || !cartData?.id || !cartData?.outlet_id || !orderType) {
        // console.log('⏳ Waiting for prerequisites before pre-check…');
        return;
      }

      const hasFreeItems = await preCheckVoucherType(parsedVoucher.id, code);

      if (hasFreeItems) {
        // console.log('🟢 Free-item voucher detected — applying directly');
        setVoucherToApply(triggerToken);
        setPendingVoucherData(null);
        setShowVoucherConfirmModal(false);
      } else {
        // console.log('🟡 Normal voucher detected — showing confirmation');
        setPendingVoucherData({ ...parsedVoucher, triggerToken });
        setVoucherToApply(null);
        setShowVoucherConfirmModal(true);
      }
    } catch (err) {
      console.error('❌ processSelectedVoucher error:', err);
    }
  }, [customerId, cartData?.id, cartData?.outlet_id, orderType]);


  useEffect(() => {
    if (!selectedVoucher) return;

    setQueuedSelectedVoucherJSON(selectedVoucher);

    if (typeof router?.setParams === 'function') {
      router.setParams({ selectedVoucher: undefined });
    }
  }, [selectedVoucher, router]);

  useEffect(() => {
    if (!queuedSelectedVoucherJSON) return;
    if (!customerId || !cartData?.id || !cartData?.outlet_id || !orderType) return;

    processSelectedVoucher(queuedSelectedVoucherJSON);
  }, [queuedSelectedVoucherJSON, customerId, cartData?.id, cartData?.outlet_id, orderType, processSelectedVoucher]);



  const handleConfirmVoucherModal = useCallback(() => {
    if (!pendingVoucherData) return;

    setShowVoucherConfirmModal(false);
    hasAppliedPromo.current = false;
    setVoucherToApply(
      pendingVoucherData.triggerToken ||
      pendingVoucherData.voucher_code ||
      String(pendingVoucherData.id ?? '')
    );
    setPendingVoucherData(null);
  }, [pendingVoucherData]);

  const handleCancelVoucherModal = useCallback(() => {
    setShowVoucherConfirmModal(false);
    setPendingVoucherData(null);
    setVoucherCode('');
    setVoucherId('');
    setVoucherToApply(null);
  }, []);

  useEffect(() => {
    if (!voucherToApply || !cartData || hasAppliedPromo.current) return;

    handleApplyVoucher();
    hasAppliedPromo.current = true;
    setVoucherToApply(null);
  }, [voucherToApply, cartData]);

  const handleRemoveVoucher = async () => {
    return runWithLoading(async () => {
      const token = await AsyncStorage.getItem('authToken') || '';
      try {
        const response = await axios.post(
          `${apiUrl}remove-voucher/${customerId}`,
          {
            cart_id: parseInt(cartData.id),
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          });

        if (response.data.status === 200) {
          setVoucherCode('');
          setPromoDiscount(0);
          refreshCartData();
          await AsyncStorage.removeItem('freeItemMaxQuantity');
          toast.show('Voucher Removed', {
            type: 'custom_toast',
            data: { title: '', status: 'success' }
          });
        }
      } catch (err) {
        console.log(err);
      }
    });
  }

  function limitDecimals(value, maxDecimals = 7) {
    if (!value) return "";
    const num = parseFloat(value);
    return Math.floor(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  }

  const refreshCartData = async () => {
    return runWithLoading(async () => {
      const token = await AsyncStorage.getItem('authToken') || '';
      try {
        const res = await axios.get(`${apiUrl}cart/get`, {
          params: {
            customer_id: customerId,
            outlet_id: selectedOutlet.outletId,
            address: deliveryAddress ? deliveryAddress.address : "",
            order_type: orderType,
            latitude: deliveryAddress ? limitDecimals(deliveryAddress.latitude) : "",
            longitude: deliveryAddress ? limitDecimals(deliveryAddress.longitude) : "",
            selected_date: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.date,
            selected_time: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.time,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.data.status === 200) {
          // console.log("refresh cart");
          const responseData = res.data.data;
          if (responseData.order_summary?.item_count === 0) {
            router.push({ pathname: '(tabs)', params: { setEmptyCartModal: true } });
          }

          setCartData(responseData);

          if ((responseData.order_summary.voucher_discount_amount !== 0 || responseData.order_summary.promo_discount_amount !== 0) && (responseData.order_summary.promo_code || responseData.order_summary.voucher_code)) {
            setPromoDiscount(parseFloat(responseData.order_summary?.promo_discount_amount || responseData.order_summary?.voucher_discount_amount));
            setVoucherToast(true);
          }
        }
      } catch (error) {
        if (error?.response?.status === 400) {
          const message = error?.response?.data?.message;

          if (message === "Every quantity requirement for this promo code is not met.") {
            setVoucherToast(false);

            setTimeout(() => {
              toast.show(message, {
                type: 'custom_toast',
                data: { title: 'Promo Code Error', status: 'warning' },
                duration: 4000, // Ensure visibility
              });
            }, 100);

            // Then update state
            setTimeout(() => {
              setVoucherCode('');
              setVoucherToApply(null);
              setPromoDiscount(0);
              refreshCartData();
            }, 100);
          } else if (message === "Two eligible items required for this promo code.") {
            setVoucherToast(false);

            setTimeout(() => {
              toast.show("Please add at least two eligible items to your cart to use this promo code.", {
                type: 'custom_toast',
                data: { title: 'Failed to apply voucher', status: 'danger' },
                duration: 4000, // Longer duration to ensure visibility
              });
            }, 100);

            // Then update state
            setTimeout(() => {
              setVoucherCode('');
              setVoucherToApply(null);
              setPromoDiscount(0);
              refreshCartData();
            }, 100);
          } else {
            setVoucherToast(false);
            toast.show(message || 'Something went wrong. Please try again.', {
              type: 'custom_toast',
              data: { title: 'Error', status: 'danger' },
            });

            // Then update state
            setTimeout(() => {
              setVoucherCode('');
              setVoucherToApply(null);
              setPromoDiscount(0);
              refreshCartData();
            }, 100);
          }
        } else {
          console.error('Unexpected error:', error);
          toast.show('Failed to refresh cart. Please try again.', {
            type: 'custom_toast',
            data: { title: 'Error', status: 'danger' },
          });
        }
      }
    });
  };

  useEffect(() => {
    if (!customerId) return;

    const fetchCart = async () => {
      await runWithLoading(async () => {
        const token = await AsyncStorage.getItem('authToken') || '';

        try {
          const res = await axios.get(`${apiUrl}cart/get`, {
            params: {
              customer_id: customerId,
              outlet_id: selectedOutlet.outletId,
              address: deliveryAddress ? deliveryAddress.address : "",
              order_type: orderType,
              latitude: deliveryAddress ? limitDecimals(deliveryAddress.latitude) : "",
              longitude: deliveryAddress ? limitDecimals(deliveryAddress.longitude) : "",
              selected_date: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.date,
              selected_time: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.time,
            },
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
          });

          if (res.data.status === 200) {
            // console.log("fetch cart");
            const responseData = res.data.data;
            setCartData(responseData);

            if (responseData.order_summary?.item_count === 0) {
              router.push({ pathname: '(tabs)', params: { setEmptyCartModal: true } });
            }
            if ((responseData.order_summary.voucher_discount_amount !== 0 || responseData.order_summary.promo_discount_amount !== 0) && (responseData.order_summary.promo_code || responseData.order_summary.voucher_code)) {
              setPromoDiscount(parseFloat(responseData.order_summary?.promo_discount_amount || responseData.order_summary?.voucher_discount_amount));
              setVoucherCode((responseData.order_summary.promo_code || responseData.order_summary.voucher_code));
              setVoucherToast(true);
            }
            if (responseData.free_item_list && responseData.free_item_list.length > 0 && responseData.bool_free_item && voucherCode) {
              setShowFreeItemsModal(true);
              setFreeItems(responseData.free_item_list);
            }
          } else {
            console.warn('Failed to load cart:', res.data);
          }
        } catch (error) {
          if (error?.response?.status === 400) {
            if (error?.response?.data?.status === 405) {
              router.push({ pathname: '(tabs)', params: { setErrorModal: true } });
              checkoutClearStorage();
            }
            const message = error?.response?.data?.message;
            // console.log(message);
            if (message === "Two eligible items required for this promo code.") {
              setVoucherToast(false);

              setTimeout(() => {
                toast.show("Please add at least two eligible items to your cart to use this promo code.", {
                  type: 'custom_toast',
                  data: { title: 'Failed to apply voucher', status: 'danger' },
                  duration: 4000 // Longer duration to ensure visibility
                });
              }, 100);

              setTimeout(() => {
                setVoucherCode('');
                setVoucherToApply(null);
              }, 100);
            }

            refreshCartData();
          }
        }
      });
    };

    fetchCart();
  }, [customerId, runWithLoading]);

  useEffect(() => {
    if (voucherToApply && cartData && !hasAppliedPromo.current) {
      handleApplyVoucher();
      hasAppliedPromo.current = true;
      setVoucherToApply(null);
    }
  }, [voucherToApply, cartData]);




  const handleAddPWPItemToCart = async (item) => {
    await runWithLoading(async () => {
      // const customerData = await getCustomerData();
      const outletDetails = await AsyncStorage.getItem('outletDetails');
      // if (outletDetails) {
      const token = await AsyncStorage.getItem('authToken');
      const parsedOutletDetails = outletDetails ? JSON.parse(outletDetails) : null;
      // }
      if (!customerData || !customerData.id || !parsedOutletDetails) {
        console.error("Customer data not found");
        toast.show('Customer data not found', { type: 'error' });
        return;
      }

      const payload = {
        customer_id: Number(customerData.id),
        // outlet_id: menuItem?.outlet_id || 1,
        outlet_id: parsedOutletDetails.outletId,
        menu_item_id: Number(item.id),
        // variation_id: selectedCrustId ? Number(selectedCrustId) : null,
        // option: optionPayload,
        quantity: 1,
        is_pwp: true,
      };
      // console.log('freeee', payload);

      try {
        const response = await axios.post(`${apiUrl}cart/add`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(response);

        if (response.data.status === 200) {
          toast.show('Item added to cart', {
            type: 'custom_toast',
            data: { title: '', status: 'success' }

          });

          refreshCartData();

          // setTimeout(() => {
          //   router.push('/menu');
          // }, 1000);
        }
        else if (response.data.status === 400) {
          const message = response.data.message;
          toast.show(message, {
            type: 'custom_toast',
            data: { title: 'Failed to add item.', status: 'danger' }

          });
        }
      } catch (err) {
        console.error('Failed to add to cart!');
        console.error(err?.response?.data || err.message);
        toast.show('Failed to add to cart', { type: 'error' });
      }
    });
  };

  const checkoutClearStorage = async () => {
    const keysToRemove = [
      'estimatedTime',
      'deliveryAddressDetails',
      'orderType',
      'outletDetails',
      'paymentMethod',
      'freeItemMaxQuantity'
    ];

    try {
      // const currentStorage = await AsyncStorage.multiGet(keysToRemove);
      // console.log('Current storage before clear:', currentStorage);
      // Perform the removal
      await AsyncStorage.multiRemove(keysToRemove);

      // Verify removal was successful
      const clearedStorage = await AsyncStorage.multiGet(keysToRemove);
      const wereCleared = clearedStorage.every(([_, value]) => value === null);

      if (!wereCleared) {
        console.error('Failed to clear these keys:',
          clearedStorage.filter(([_, value]) => value !== null)
        );
        throw new Error('Storage clearance failed');
      }

      // console.log('Storage cleared successfully');
      return true;
    } catch (err) {
      console.error('Clearance error:', err);
      return false;
    }
  };

  const handleCheckout = async () => {
    if (isCheckoutProcessing) {
      console.log('Checkout already in progress, ignoring click');
      return;
    }

    setIsCheckoutProcessing(true);
    // await runWithLoading(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken') || '';

      const payload = {
        customer_id: Number(cartData?.customer_id),
        // customer_id: Number(165),
        outlet_id: selectedOutlet.outletId,
        customer_address_id: deliveryAddress.addressId,
        order_type: orderType,
        // order_type: 'delivery',
        payment_method: paymentMethod,
        expected_ready_time: '',
        placed_at: '',
        selected_date: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.date,
        selected_time: estimatedTime.estimatedTime === "ASAP" ? null : estimatedTime.time,
        notes: ''
      };

      // console.log('Sending checkout payload:', payload);
      const res = await axios.post(`${apiUrl}order/create`, payload, {
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (res.data?.status === 200) {
        toast.show('Your order has been placed!', {
          type: 'custom_toast',
          data: { title: '', status: 'success' }
        });
        // checkoutClearStorage();

        await AsyncStorage.setItem('orderId', res.data?.order?.id);
        // console.log(res.data?.order?.id);
        const clearanceSuccess = await checkoutClearStorage();

        if (!clearanceSuccess) {
          toast.show('Order placed but cache cleanup failed', {
            type: 'custom_toast',
            data: { title: 'Warning', status: 'warning' }
          });
        }


        const redirectUrl = res.data.redirect_url?.trim();
        // handlePaymentCallBack();
        if (redirectUrl) {
          if (Platform.OS === 'web') {
            // Web solution
            window.location.href = redirectUrl;
          } else {
            setPaymentUrl(redirectUrl);
            setShowPaymentScreen(true);
          }

        } else {
          router.push('/orders');
        }

      } else {
        console.error('Order failed:', res.data);
        toast.show('Failed to place order. Please try again.', {
          type: 'custom_toast',
          data: { title: '', status: 'warning' }
        });
      }

    } catch (err) {
      if (err?.response?.data?.status === 400) {
        if (err?.response?.data?.status === 405) {
          router.push({ pathname: '(tabs)', params: { setErrorModal: true } });
          checkoutClearStorage();
        }
        else if (err?.response?.data?.status === 400) {
          const message = err?.response?.data?.messages?.error ?? "";
          if (message === "Insufficient Wallet Balance") {
            toast.show("Please top up your wallet balance or change a payment method.", {
              type: 'custom_toast',
              data: { title: 'Insufficient Wallet Balance', status: 'warning' }
            });
          } else {
            toast.show(message, {
              type: 'custom_toast',
              data: { title: '', status: 'warning' }
            });
            router.push({ pathname: '(tabs)/menu' });

          }

          // console.log('Error fetching cart total:', error?.response?.data?.message ?? "Outlet not available for this order type");
        }
        else {
          toast.show('Failed to place order. Please try again.', {
            type: 'custom_toast',
            data: { title: 'Order Failed', status: 'warning' }
          });
        }

      }
    } finally {
      setIsCheckoutProcessing(false);
    }
    // });
  }
  // console.log('ID:', item.menu_item_id);
  const confirmDelete = async (item) => {
    await runWithLoading(async () => {
      try {
        const token = await AsyncStorage.getItem('authToken') || '';
        // console.log('Deleting item with ID:', item.cart_item_id || item.id);

        const res = await axios.post(`${apiUrl}cart/update`, {
          customer_id: customerId,
          outlet_id: item.outletId,
          action: 3,
          cart_item_id: item.cart_item_id || item.id
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        });

        if (res.data.status === 200) {
          toast.show('Item Removed', {
            type: 'custom_toast',
            data: { title: '', status: 'success' }
          });
          refreshCartData(); // Call the callback to refresh cart data
        } else {
          toast.show(res.data.message || 'Failed to delete item.', { type: 'error' });
        }
      } catch (err) {
        console.error('Delete error:', err);
        toast.show('Something went wrong. Please try again.', { type: 'error' });
      }
    });
  };

  const handleApplyVoucher = async () => {
    if (applyingVoucher) return;

    setApplyingVoucher(true);

    try {
      await runWithLoading(async () => {
        const token = (await AsyncStorage.getItem('authToken')) || '';

        // ✅ Always prioritize new voucher from URL param if available
        const newVoucherCode = voucherToApply || voucherCode;
        const code = voucherId ? '' : (newVoucherCode || '').trim();

        if (!voucherId && !code) {
          toast.show('Please enter a voucher code.', {
            type: 'custom_toast',
            data: { title: '', status: 'warning' }
          });
          return;
        }
        if (!cartData) {
          toast.show('Please wait a moment.', {
            type: 'custom_toast',
            data: { title: '', status: 'info' }
          });
          return;
        }

        try {
          if (voucherCode && voucherCode !== code) {
            // console.log('Removing old voucher:', voucherCode);
            await handleRemoveVoucher();

            // ✅ Wait a moment to ensure backend fully updates before applying new one
            await new Promise((r) => setTimeout(r, 300));

            setVoucherCode('');
          }

          console.log('Applying new voucher:', code || voucherId);
          const res = await axios.post(
            `${apiUrl}redeem-voucher/${customerId}`,
            {
              promo_code: voucherId ? '' : code,
              voucher_id: voucherId || '',
              cart_id: parseInt(cartData.id),
              outlet_id: parseInt(cartData.outlet_id),
              order_type: orderType
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (res.data.status === 400 || res.data.data?.status === 400) {
            const message = res.data.result || res.data.message;
            toast.show(message, {
              type: 'custom_toast',
              data: { title: 'Failed to apply voucher', status: 'warning' }
            });
            setVoucherCode('');
            setVoucherToApply(null);
            return;
          }

          if (res.data.status === 200) {
            // console.log('New voucher applied successfully:', code || voucherId);
            const promoSettings = res.data.data.promo_settings;
            setPromoSettings(promoSettings);

            if (promoSettings?.promo_type === "free_item" && promoSettings?.amount) {
              await AsyncStorage.setItem("freeItemMaxQuantity", String(promoSettings.amount));
            }

            let items = [];
            const freeItemsData = res.data.data.free_items;

            if (Array.isArray(freeItemsData)) {
              items = freeItemsData;
            } else if (typeof freeItemsData === "object" && freeItemsData !== null) {
              items = Object.values(freeItemsData).flat();
            }

            if (items.length > 0) {
              const normalized = items.map(it => ({
                id: String(it.id),
                variation_id: String(it.variation_id),
                title: it.title,
                image:
                  Array.isArray(it.image_url) && it.image_url[0]?.image_url
                    ? it.image_url[0].image_url
                    : undefined
              }));
              setFreeItems(normalized);
              setSelectedFreeItemId(normalized[0]?.id || null);
              setShowFreeItemsModal(true);
            } else {
              setVoucherCode(code); // ✅ use the new one from param
              await refreshCartData();

              if (voucherToast && (cartData?.order_summary?.promo_code || cartData?.order_summary?.voucher_code) !== "") {
                toast.show('Voucher applied successfully!', {
                  type: 'custom_toast',
                  data: { title: '', status: 'success' }
                });
                setVoucherToast(false);
              }
            }
          } else {
            toast.show(res.data.message || 'Failed to apply voucher.', {
              type: 'custom_toast',
              data: { title: '', status: 'warning' }
            });
          }
        } catch (err) {
          console.error('Promo apply error:', err?.response?.data || err.message);
          const msg =
            err?.response?.data?.messages?.error ||
            err?.response?.data?.message ||
            'Something went wrong. Try again.';
          toast.show(msg, {
            type: 'custom_toast',
            data: { title: '', status: 'warning' }
          });
        }
      });
    } catch (err) {
      console.error('Voucher apply error:', err);
    } finally {
      setApplyingVoucher(false);
    }
  };


  const formatEstimatedTime = (estimatedTime) => {

    if (estimatedTime && estimatedTime === "ASAP") {
      return "ASAP (30 - 45 mins)";
    } else {
      return estimatedTime;
    }

  }

  const handleAddFreeItemToCart = async (item) => {
    await runWithLoading(async () => {
      // const customerData = await getCustomerData();
      const outletDetails = await AsyncStorage.getItem('outletDetails');
      // if (outletDetails) {
      const token = await AsyncStorage.getItem('authToken');
      const parsedOutletDetails = outletDetails ? JSON.parse(outletDetails) : null;
      // }
      if (!customerData || !customerData.id || !parsedOutletDetails) {
        console.error("Customer data not found");
        toast.show('Customer data not found', { type: 'error' });
        return;
      }

      const payload = {
        customer_id: Number(customerData.id),
        // outlet_id: menuItem?.outlet_id || 1,
        outlet_id: parsedOutletDetails.outletId,
        menu_item_id: Number(item.id),
        variation_id: Number(item.variation_id),
        // variation_id: selectedCrustId ? Number(selectedCrustId) : null,
        // option: optionPayload,
        quantity: 1,
        is_free_item: 1,
      };
      // console.log('freeee', payload);

      try {
        const response = await axios.post(`${apiUrl}cart/add`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // console.log(response);

        if (response.data.status === 200) {
          toast.show('Item added to cart', {
            type: 'custom_toast',
            data: { title: '', status: 'success' }

          });

          router.replace('/screens/orders/checkout');

          // setTimeout(() => {
          //   router.push('/menu');
          // }, 1000);
        }
        else if (response.data.status === 400) {
          const message = response.data.message;
          toast.show(message, {
            type: 'custom_toast',
            data: { title: 'Failed to add item.', status: 'danger' }

          });
        }
      } catch (err) {
        console.error('Failed to add to cart!');
        console.error(err?.response?.data || err.message);
        toast.show('Failed to add to cart', { type: 'error' });
      }
    });
  };

  const renderFreeItemsModal = () => (
    <Modal
      visible={showFreeItemsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFreeItemsModal(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <View style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: 20,
          width: Math.min(width * 0.85, 400),
          maxHeight: '70%',
        }}>
          <Text style={{
            fontFamily: 'Route159-Bold',
            fontSize: 20,
            color: '#C2000E',
            marginBottom: 16,
            textAlign: 'center'
          }}>
            Choose Your Free Item
          </Text>
          <ScrollView>
            {freeItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: '#eee',
                  paddingBottom: 12,
                }}
                onPress={() => {
                  setShowFreeItemsModal(false);
                  // console.log(item);
                  handleAddFreeItemToCart(item);
                }}
              >
                <Image
                  source={{ uri: item.image }}
                  style={{ width: 60, height: 60, borderRadius: 8, marginRight: 14 }}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{
                    fontFamily: 'Route159-Bold',
                    fontSize: 16,
                    color: '#C2000E',
                  }}>{item.title}</Text>
                  <Text style={{
                    fontFamily: 'Route159-Regular',
                    fontSize: 13,
                    color: '#555',
                    marginTop: 4,
                  }}>{item.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={{
              marginTop: 18,
              backgroundColor: '#C2000E',
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: 'center'
            }}
            onPress={() => { setShowFreeItemsModal(false); setVoucherCode(""); setPromoSettings({}); handleRemoveVoucher() }}
          >
            <Text style={{
              color: '#fff',
              fontFamily: 'Route159-Bold',
              fontSize: 16
            }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const handlePaymentModalClose = async () => {
    setShowPaymentScreen(false);
    const orderId = await AsyncStorage.getItem('orderId');
    router.replace(`/screens/orders/orders_details?orderId=${orderId}`);
  }

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        {renderFreeItemsModal()}
        <TopNavigation title="MY ORDER" isBackButton={true} navigatePage={() => { if (vip === '1') { router.push('(tabs)/profile') } else { router.push('(tabs)/menu') } }} />

        <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          <AddressCard orderType={orderType} address={orderType === "delivery" ? deliveryAddress.address : selectedOutlet.outletTitle} timeEstimate={formatEstimatedTime(selectedDateTime)} setShowDateTimePicker={setShowDateTimePicker} />
          {/* Order Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Order Summary</Text>
            {cartData?.items.map((item) => (
              <OrderItem
                key={item.id}
                item={{
                  id: item.menu_item_id,
                  cart_item_id: item.id,
                  name: item.title,
                  quantity: item.quantity,
                  outletId: selectedOutlet.outletId,
                  price: parseFloat(item.unit_price),
                  is_free_item: item.is_free_item,
                  max_quantity: item.is_free_item ? Number(freeItemMaxQty) : null,
                  originalPrice: item.variation?.price
                    ? parseFloat(item.variation.price)
                    : item.original_price
                      ? parseFloat(item.original_price)
                      : null,
                  options: item.options,
                  variation: item.variation,
                  image: item?.variation?.images ? item?.variation?.images : (item?.image ? item?.image : 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500'),
                  note: item.note || '',
                }}
                // toast={toast}
                // onItemDeleted={refreshCartData}
                // customerId={customerId}
                setShowDeleteModal={setShowDeleteModal}
                setDeleteItem={setDeleteItem}
                confirmDelete={confirmDelete}
                vip={vip}
              />
            ))}
          </View>

          <View style={styles.separator} />
          {vip ? null : (
            <>
              <View style={styles.section}>
                <TouchableOpacity style={styles.addMoreButton}>
                  <FontAwesome6 name="circle-plus" size={16} color="#C2000E" />
                  <Text
                    style={styles.addMoreText}
                    onPress={() => router.push({
                      pathname: '/menu',
                    })}
                  >
                    Add more items
                  </Text>
                </TouchableOpacity>
              </View>

              {cartData?.pwp_menu.length !== 0 ? (
                <>
                  <View style={styles.separator} />

                  {/* Popular */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Popular with your order</Text>
                    <Text style={styles.sectionSubtitle}>
                      Other customers also bought these
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingTop: 10 }}
                    >
                      {cartData?.pwp_menu.map((item) => (
                        <PopularItemCard
                          key={item.id}
                          item={{
                            id: item.id,
                            name: item.title || item.name || 'Untitled',
                            image: item.image || '1752202204_af4281ad04342c083184.jpg',
                            price: parseFloat(item.pwp_price || 0),
                            originalPrice: parseFloat(item.original_price || item.price || 0),
                          }}
                          handleAddToCart={handleAddPWPItemToCart}
                        />
                      ))}
                    </ScrollView>
                  </View>
                </>
              ) : null}

              <View style={styles.separator} />
            </>
          )}
          {customerData ? <PaymentMethodButton
            selectedMethod={paymentMethod}
            navigation={navigation}
            walletBalance={customerData?.customer_wallet}
          /> : null}
          <View style={styles.section}>
            <Text style={styles.sectionVouchers}>Vouchers</Text>
            <TouchableOpacity
              style={styles.voucherButton}
              onPress={() => router.push('/screens/voucher/select')}
            >
              <View style={styles.voucherRow}>
                <FontAwesome6 name="circle-plus" size={20} color="#C2000E" />
                <Text style={styles.voucherText}>
                  {promoDiscount > 0 ? `Promo Applied! - RM ${promoDiscount.toFixed(2)}` : 'Add Voucher'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#C2000E" />
              </View>
            </TouchableOpacity>
            {voucherCode !== '' && (
              <View style={{
                backgroundColor: '#FFF0F0',
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderColor: '#C2000E',
                borderWidth: 1,
                marginTop: 8,
                marginHorizontal: 4,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <Text style={{
                  color: '#C2000E',
                  fontFamily: 'Route159-Bold',
                  fontSize: 14,
                }}>
                  🎟 Applied Voucher: {voucherCode}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    handleRemoveVoucher();
                    // }
                  }}
                >
                  <FontAwesome6 name="circle-xmark" size={20} color="#C2000E" />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={styles.separator} />


          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>
                RM {parseFloat(cartData?.order_summary?.subtotal_amount || 0).toFixed(2)}
              </Text>
            </View>

            {cartData?.order_summary?.store_discount &&
              Object.keys(cartData?.order_summary?.store_discount).length !== 0 ? (
              Object.entries(cartData?.order_summary?.store_discount).map(([key, discount]) => (
                <View key={key} style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    {discount.discount_name} Discount
                    {discount.discount_type === 'percentage' && ` (${parseFloat(discount.discount_value)}%)`}
                  </Text>
                  <Text style={styles.totalValue}>
                    - RM {parseFloat(discount.discount_amount).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : null}

            {(parseFloat(cartData?.order_summary?.promo_discount_amount) > 0 ||
              parseFloat(cartData?.order_summary?.voucher_discount_amount) > 0) ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <Text style={styles.totalValue}>
                  - RM {parseFloat(cartData?.order_summary?.promo_discount_amount || cartData?.order_summary?.voucher_discount_amount).toFixed(2)}
                </Text>
              </View>
            ) : null}
            {/* {cartData?.tax_detail.length !== 0 ? (<View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Tax Charges ({parseInt(cartData?.tax_detail[0]?.tax_rate)}% {cartData?.tax_detail[0]?.tax_type})</Text>
              <Text style={styles.totalValue}>
                RM {parseFloat(cartData?.order_summary?.tax_amount || 0).toFixed(2)}
              </Text>
            </View>) : null} */}
            {cartData?.tax_detail && cartData?.tax_detail.length > 0 && (
              <View>
                {cartData.tax_detail.map((tax, index) => (
                  <View key={index} style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      {tax.tax_type} ({parseInt(tax.tax_rate)}%)
                    </Text>
                    <Text style={styles.totalValue}>
                      RM {parseFloat(tax.tax_amount).toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            )}


            {/*add 1 more row named as Delivery Fee discount*/}
            {orderType === "delivery" ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Standard Delivery</Text>
                <Text style={styles.totalValue}>RM {parseFloat(cartData?.order_summary?.delivery_fee || 0).toFixed(2)}</Text>
              </View>
            ) : null}

            {orderType === "delivery" && cartData?.order_summary?.delivery_fee_discount > 0 ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Delivery Discount</Text>
                <Text style={styles.totalValue}>
                  - RM {parseFloat(cartData?.order_summary?.delivery_fee_discount).toFixed(2)}
                </Text>
              </View>
            ) : null}

            {(orderType === "delivery" || orderType === "pickup") && cartData?.order_summary?.packaging_charge !== "0.00" ? (<View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Packaging Charges</Text>
              <Text style={styles.totalValue}>RM {parseFloat(cartData?.order_summary?.packaging_charge || 0).toFixed(2)}</Text>
            </View>) : null}
          </View>

          {cartData?.order_summary?.rounding_amount !== "0.00" ? <View style={styles.separator} /> : null}

          <View style={styles.roundingTotalsSection}>
            {cartData?.order_summary?.rounding_amount !== "0.00" ?
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Grand Total Before Rounding</Text>
                  <Text style={styles.totalValue}>RM {cartData?.order_summary?.grand_total_without_rounding}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Rounding Adj</Text>
                  <Text style={styles.totalValue}>{cartData?.order_summary?.rounding_amount < 0 ? "- RM" : "RM"} {Math.abs(parseFloat(cartData?.order_summary?.rounding_amount || 0)).toFixed(2)}</Text>
                </View>

              </> : null}

          </View>

          <View style={styles.separator} />

          <View style={[styles.totalsSection, { paddingBottom: 0 }]}>
            <View style={[styles.totalRow, { marginBottom: 0 }]}>
              <Text style={styles.grandtotalTitle}>Total(incl.fees and tax)</Text>
              <Text style={styles.grandtotalTitle}>
                RM {parseFloat(cartData?.order_summary?.grand_total || 0).toFixed(2)}
              </Text>
            </View>
          </View>

          {(parseFloat(cartData?.order_summary?.discount_amount) > 0 || parseFloat(cartData?.order_summary?.promo_discount_amount) > 0 ||
            parseFloat(cartData?.order_summary?.voucher_discount_amount) > 0) ? (
            <View style={{
              marginHorizontal: 10,
              padding: 5
            }}>
              <Text style={{
                fontFamily: 'Route159-Regular',
                fontSize: 14,
                color: '#C2000E',
                textAlign: 'right',
                fontStyle: 'italic'
              }}>
                <Text style={{ fontSize: 17, marginRight: 3 }}>🎉</Text>
                You have saved RM {parseFloat(cartData?.order_summary?.discount_amount + cartData?.order_summary?.promo_discount_amount + cartData?.order_summary?.voucher_discount_amount).toFixed(2)} in this order!
              </Text>
            </View>
          ) : null}
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={{
              width: '100%',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={handleCheckout}
          >
            <CustomTabBarBackground />
            <Text
              style={styles.placeOrderText}>
              Place Order
            </Text>
          </TouchableOpacity>
        </View>
        {selectedOutlet ? <CustomDateTimePickerModal
          showDateTimePicker={showDateTimePicker}
          setShowDateTimePicker={setShowDateTimePicker}
          setSelectedDateTime={setSelectedDateTime}
          outletId={selectedOutlet.outletId}
        /> : null}

        <ConfirmationModal
          title={"Delete Confirmation"}
          subtitle={"Are you sure you want to delete this item?"}
          confirmationText={"Delete"}
          onConfirm={() => {
            setShowDeleteModal(false);
            confirmDelete(deleteItem);
          }}
          onCancel={() => setShowDeleteModal(false)}
          isVisible={showDeleteModal}
        />

        <ConfirmationModal
          title={"Apply Voucher?"}
          subtitle={"Are you sure you want to apply this voucher? If yes, your store discount will be removed."}
          confirmationText={"Apply"}
          onConfirm={handleConfirmVoucherModal}
          onCancel={handleCancelVoucherModal}
          isVisible={showVoucherConfirmModal}
        />

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

        <Modal
          transparent
          visible={isLoading}
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#C2000E" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </ResponsiveBackground >
  );
}

// Inserts zero-width spaces into long unbroken sequences so Text can wrap
const formatLongNote = (note) => {
  if (!note || typeof note !== 'string') return '';
  // Insert \u200B after every 12 non-separator characters to allow wrapping
  return note.replace(/([^\s\-_/\\.,;:]{12})(?=[^\s\-_/\\.,;:])/g, '$1\u200B');
};

const styles = StyleSheet.create({
  noteBadge: {
    backgroundColor: '#FFF0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFD1D1',
    alignSelf: 'flex-start',
    marginTop: 4,
    maxWidth: '90%',
  },
  noteText: {
    fontFamily: 'Route159-Regular',
    fontSize: 11,
    color: '#C2000E',
    // Ensure text can shrink and wrap within its container
    flexShrink: 1,
  },
  voucherButton: {
    marginTop: 10,
    marginHorizontal: 4,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FFF',
  },

  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  voucherText: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#333',
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
    // fontSize: 16,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 15) : 18) : 16,
    color: '#333',
  },
  grandtotalTitle: {
    fontFamily: 'Route159-Bold',
    // fontSize: 20,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 15) : 18) : 20,
    color: '#C2000E',
    marginVertical: '2%',
  },
  voucherContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 50,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  voucherIcon: {
    marginRight: 10,
  },
  voucherInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Route159-SemiBold',
    fontSize: 16,
    color: '#333',
    borderColor: 'transparent',
    outlineStyle: 'none',
  },
  applyButton: {
    backgroundColor: '#C2000E',
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    fontFamily: 'Route159-Bold',
  },
  applyButtonText: {
    color: 'white',
    fontFamily: 'Route159-SemiBold',
    fontSize: 14,
    fontWeight: 'bold',
  },
  addressCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    position: 'relative',
    overflow: 'hidden',
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressCardTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#C2000E',
    marginLeft: 8,
  },
  addressCardBody: {
    marginBottom: 12,
  },
  addressCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 12,
  },
  changeAddressButton: {
    alignSelf: 'flex-start',
  },
  changeAddressText: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#C2000E',
    // marginRight: '1%'
    // textDecorationLine: 'underline',
  },
  addressCardDecoration1: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(194, 0, 14, 0.1)',
  },
  addressCardDecoration2: {
    position: 'absolute',
    bottom: -15,
    left: -15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(194, 0, 14, 0.05)',
  },

  paymentMethodContainer: {
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  paymentMethodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  paymentMethodOptions: {
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  paymentMethodOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  selectedPaymentMethod: {
    backgroundColor: '#FFF9F9',
  },
  paymentMethodOptionText: {
    fontFamily: 'Route159-Book',
    fontSize: 16,
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Route159-Bold',
    color: '#C2000E',
  },
  deliveryTabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  tabButton: {
    paddingVertical: 6,
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Route159-SemiBold',
    color: '#888',
  },
  deliveryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addressText: {
    marginLeft: 8,
    fontFamily: 'RobotoSlab-Regular',
  },
  progressContainer: {
    paddingHorizontal: 30,
    paddingVertical: 20,
    position: 'relative',
    height: 50,
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#FAD4D4',
    borderRadius: 3,
  },
  progressFill: {
    height: '100%',
    width: '70%',
    backgroundColor: '#C2000E',
    borderRadius: 3,
  },
  progressNode: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -12 }],
    left: '5%',
  },
  mapContainer: {
    paddingHorizontal: 16,
  },
  etaText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    marginBottom: 8,
    color: '#727171',
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
  sectionVouchers: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    marginBottom: 0,
    paddingLeft: 4,
  },
  sectionSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
    paddingLeft: 6,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#C2000E',
    marginHorizontal: 16,
  },
  // orderItem: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   marginBottom: '7%',
  // },
  // orderItemTop: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'flex-start',
  //   height: '50%',
  // },
  // orderItemBottom: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'flex-end',
  //   height: '55%',
  // },
  // orderItemImage: {
  //   width: 100,
  //   height: 100,
  //   borderRadius: 8,
  //   alignSelf: 'center',
  // },
  // orderItemDetails: {
  //   flex: 1,
  //   marginLeft: 12,
  //   flexDirection: 'column',
  //   height: 100,
  //   paddingVertical: 3,
  // },
  // orderItemName: {
  //   fontFamily: 'Route159-Bold',
  //   fontSize: 16,
  //   color: '#C2000E',
  //   minHeight: 18,
  //   lineHeight: 18,
  // },
  // orderItemPriceContainer: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  // },
  orderItemOriginalPrice: {
    fontFamily: 'Route159-Regular',
    textDecorationLine: 'line-through',
    color: '#999',
    fontSize: 12,
    marginRight: 10,
  },
  orderItemPrice: {
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#C2000E',
  },
  orderItemEdit: {
    fontFamily: 'Route159-Bold',
    fontSize: 12,
    color: '#C2000E',
    textDecorationLine: 'underline',
  },
  itemQuantity: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#727171',
  },
  itemOption: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#727171',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  addMoreText: {
    marginLeft: 8,
    color: '#C2000E',
    fontFamily: 'Route159-Bold',
  },
  popularItemCard: {
    width: 120,
    marginRight: 12,
    alignItems: 'center',
  },
  popularItemImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  popularItemName: {
    fontFamily: 'Route159-Bold',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    minHeight: 30,
  },
  popularItemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  popularItemOriginalPrice: {
    fontFamily: 'Route159-Regular',
    textDecorationLine: 'line-through',
    color: '#999',
    fontSize: 11,
    marginRight: 4,
  },
  popularItemPrice: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#C2000E',
  },
  popularItemAddButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C2000E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalsSection: {
    padding: 14,
  },
  roundingTotalsSection: {
    padding: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#555',
  },
  totalValue: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#555',
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
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
    marginBottom: '7%',
    paddingHorizontal: 4, // Added padding to prevent edge issues
  },
  orderItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4, // Added spacing between top and bottom sections
  },
  orderItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 4, // Added spacing
  },
  orderItemImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    alignSelf: 'flex-start', // Changed from 'center' to 'flex-start'
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'column',
    minHeight: 100, // Changed from fixed height to minHeight
    paddingVertical: 3,
  },
  orderItemName: {
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#C2000E',
    flex: 1, // Allow text to take available space
    marginRight: 8, // Space before EDIT button
  },
  orderItemPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4, // Added spacing
  },
  map: { flex: 1, height: 250, borderRadius: 12 },
  driverIcon: { width: 50, height: 50 },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 160,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#C2000E',
  },
});
