// screens/orders/checkout.js
'use client';

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
  TouchableOpacity,
  View,
  Alert,
  Animated,
  Easing,
  Modal,
  Dimensions,
  Linking,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from '../../../components/order/MapView';
import OrderProgressBar from '../../../components/order/OrderProgressBar';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { imageUrl } from '../../constant/constants';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import * as WebBrowser from 'expo-web-browser';
import useAuthGuard from '../../auth/check_token_expiry';
import ProofOfDeliveryModal from '../../../components/ui/ProofOfDeliveryModal';
import PaymentScreen from '../../../components/ui/PaymentScreen';
import { FontAwesome } from "@expo/vector-icons";


const { width } = Dimensions.get('window');
const supportsNativeDriver = Platform.OS !== 'web';

const pointA = { latitude: 3.1390, longitude: 101.6869 };
const pointB = { latitude: 3.1520, longitude: 101.7000 };

// Separate component for map section to prevent re-renders
const MapSection = React.memo(({ driverPos, pointA, pointB, mapRef, order }) => {
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
          {order.expected_ready_time !== "0000-00-00 00:00:00" ? order.expected_ready_time : "12:50~1:20"}
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
const OrderItem = React.memo(({ item }) => {
  const [isOptionsModalVisible, setOptionsModalVisible] = useState(false);

  const options = item?.options || [];
  const extraOptionsCount = options.length > 3 ? options.length - 3 : 0;
  const displayedOptions = options.slice(0, 3);

  const openOptionsModal = () => {
    if (options.length >= 4) {
      setOptionsModalVisible(true);
    }
  };

  const closeOptionsModal = () => {
    setOptionsModalVisible(false);
  };
  return (
    <>
      <View style={styles.orderItem}>
        {item?.menu_image?.image_url ? (
          <Image
            source={{ uri: `${imageUrl}menu_images/${item.menu_image.image_url}` }}
            style={styles.orderItemImage}
          />
        ) : (
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' }}
            style={styles.orderItemImage}
          />
        )}
        <View style={styles.orderItemDetails}>
          <View style={styles.orderItemTop}>
            <View style={[commonStyles.column, styles.orderSummaryTitle]}>
              <Text
                style={styles.orderItemName}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {item?.title}
              </Text>
              {item?.variation ? (
                <Text style={styles.itemOption}>{item.variation.title}</Text>
              ) : null}

              <View style={styles.orderItemPriceContainer}>
                {options.length > 0 ? (
                  <>
                    {displayedOptions.map((optionItem, idx) => {
                      const title = optionItem?.option_title || '';
                      const price = optionItem?.price_adjustment
                        ? `(RM ${optionItem?.price_adjustment})`
                        : '';
                      const keyBase = optionItem?.id || `${title}-${idx}`;

                      return (
                        <View key={keyBase} style={styles.optionRow}>
                          <Text
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            style={[styles.itemOption, styles.optionTitle]}
                          >
                            {`+ ${title}`}
                          </Text>
                          {price ? (
                            <Text style={[styles.itemOption, styles.optionPrice]}>
                              {price}
                            </Text>
                          ) : null}
                        </View>
                      );
                    })}

                    {extraOptionsCount > 0 && (
                      <TouchableOpacity
                        onPress={openOptionsModal}
                        style={styles.moreOptionsButton}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[styles.itemOption, styles.moreOptionsText]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {`+ ${extraOptionsCount} more option(s)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : null}
              </View>
            </View>
            <View style={commonStyles.alignRight}>
              <Text style={styles.orderItemPrice}>
                {item?.is_free_item === '1' ? 'Free Item' : `RM ${item?.line_subtotal}`}
              </Text>
            </View>
          </View>
          <View style={styles.orderItemBottom}>
            <View style={{ flex: 1 }}>
              <View style={commonStyles.alignLeft}>
                <Text style={styles.itemQuantity}>Qty: {item?.quantity}</Text>
                {item.note && (item.note != '' || item.note != null) ? (
                  <View style={styles.noteBadge}>
                    <Text style={styles.noteText}>Note: {item.note}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>
      </View>

      <Modal
        visible={isOptionsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeOptionsModal}
      >
        <View style={styles.optionsModalBackdrop}>
          <View style={styles.optionsModalContent}>
            <Text style={styles.optionsModalTitle}>Item Options</Text>
            <ScrollView
              style={styles.optionsModalList}
              contentContainerStyle={styles.optionsModalListContent}
              showsVerticalScrollIndicator={false}
            >
              {options.map((optionItem, idx) => {
                const title = optionItem?.option_title || '';
                const price = optionItem?.price_adjustment
                  ? `(RM ${optionItem?.price_adjustment})`
                  : '';
                const keyBase = optionItem?.id || `${title}-${idx}`;

                return (
                  <View key={keyBase} style={styles.optionsModalRow}>
                    <Text style={styles.optionsModalOption}>{title}</Text>
                    {price ? (
                      <Text style={styles.optionsModalPrice}>{price}</Text>
                    ) : null}
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity
              onPress={closeOptionsModal}
              style={styles.optionsModalCloseButton}
              activeOpacity={0.7}
            >
              <Text style={styles.optionsModalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
});
OrderItem.displayName = 'OrderItem';

//{uri: imageUrl} or require('../../imagepath')
const AnimationImage = ({ image, containerStyle = styles.orderDetailsIconSection }) => {
  const opacityValue = useRef(new Animated.Value(1)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Random twinkle timing (adjust durations for faster/slower twinkles)
    Animated.loop(
      Animated.sequence([
        // Fade out slightly + scale down
        Animated.parallel([
          Animated.timing(opacityValue, {
            toValue: 0.7,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
          Animated.timing(scaleValue, {
            toValue: 0.95,
            duration: 300,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
        ]),
        // Brighten + scale up (stronger twinkle)
        Animated.parallel([
          Animated.timing(opacityValue, {
            toValue: 1.2, // Slightly over-brighten for emphasis
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
          Animated.timing(scaleValue, {
            toValue: 1.1,
            duration: 200,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
        ]),
        // Return to normal
        Animated.parallel([
          Animated.timing(opacityValue, {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 500,
            easing: Easing.linear,
            useNativeDriver: supportsNativeDriver,
          }),
        ]),
        // Pause between twinkles
        Animated.delay(1000),
      ])
    ).start();
  }, [opacityValue, scaleValue]);

  return (
    <View style={containerStyle}>
      <Animated.Image
        source={image}
        defaultSource={require('../../../assets/elements/home/home_pickup.png')}
        style={[
          styles.orderDetailsIcon,
          {
            opacity: opacityValue,
            transform: [{ scale: scaleValue }],
          },
        ]}
      />
    </View>
  );
};

const DeliveryStatus = ({ stage = "preparing", item, expected_ready_time }) => {

  const isScheduledOrder = item?.selected_date && item?.selected_time;

  if (stage.toLocaleLowerCase() === "pending") {
    stage = "confirmed"
  }

  const status = [
    { stage: "completed", image: require('../../../assets/elements/home/recharge_gift.png'), title: "Order Completed", subtitle: "Thank you for your support! Comeback for more Ultra Sedap!" },
    { stage: "on_the_way", image: require('../../../assets/elements/order/driver.png'), title: "Out for Delivery", subtitle: "Pizza is on the road! Countdown to Ultra Sedap" },
    {
      stage: "preparing", image: require('../../../assets/elements/order/pizza.png'), title: "Preparing Order", subtitle: isScheduledOrder
        ? `You can head over now for your pickup at ${expected_ready_time}`
        : "Freshness in progress - just for you."
    },
    { stage: "picked_up", image: require('../../../assets/elements/home/home_pickup.png'), title: "Order Ready", subtitle: "Your order has been picked up by the driver" },
    {
      stage: "confirmed", image: require('../../../assets/elements/order/pizza.png'), title: "Order Confirmed!", subtitle: isScheduledOrder
        ? `We will prepare your pizza fresh and have it ready at ${expected_ready_time}` : "Get ready... ultra sedap is coming your way!"
    },
    // { stage: "pending", image: require('../../../assets/elements/order/pizza.png'), title: "Pending Order", subtitle: "We will be preparing your order when its the time." },

  ]

  const statusObj = status.find(obj => obj.stage === stage);

  return (
    <View style={styles.pickupstatusContainer}>
      <Text style={styles.etaText}>
        Expected to be ready at { }
        <Text
          style={{
            color: '#C2000E',
            fontFamily: 'Route159-Heavy',
            fontSize: 18,
          }}
        >
          {expected_ready_time}
        </Text>
      </Text>


      <View style={styles.pickupstatusSection}>

        {/* <View style={styles.alignCenterContainer}>
          <Text style={styles.totalLabel}>Your Pickup No.</Text>
          <Text style={styles.pickupNo}>{item?.order_so ? (item.order_so).slice(-5) : ""}</Text>
        </View> */}
        <View style={styles.pickupIconContainer}>
          <View style={{ paddingBottom: '2%' }}>
            <AnimationImage
              // image={require('../../../assets/elements/profile/invoice.png')}
              image={statusObj?.image}
              containerStyle={styles.pickupStatusIconSection} />
          </View>

          <View style={styles.alignCenterContainer}>
            <Text style={styles.orderItemName}>{statusObj?.title}</Text>
            <Text style={styles.totalLabel}>{statusObj?.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* <AnimationImage image={require('../../../assets/elements/profile/invoice.png')} /> */}
    </View >
  )
}

const PickupStatus = ({ stage = "preparing", item, expected_ready_time }) => {

  // console.log(item.selected_date, item.selected_time)
  const isScheduledOrder = item?.selected_date && item?.selected_time;


  if (stage.toLocaleLowerCase() === "pending") {
    stage = "preparing"
  }

  const now = new Date();
  const [readyHour, readyMin] = expected_ready_time.split(':');
  const readyDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parseInt(readyHour), parseInt(readyMin));
  const msDiff = readyDate - now;
  if (msDiff > 60 * 60 * 1000 && stage !== 'ready_to_pickup' && stage !== 'completed') {
    stage = "pending"
  }

  const status = [
    { stage: "completed", image: require('../../../assets/elements/home/recharge_gift.png'), title: "Order Completed", subtitle: "Thank you for your support! Come back for more Ultra Sedap!" },
    {
      stage: "preparing", image: require('../../../assets/elements/order/pizza.png'), title: "Preparing Order", subtitle: isScheduledOrder
        ? `You can head over now for your pickup at ${expected_ready_time}`
        : "Freshness in progress - just for you."
    },
    {
      stage: "pending", image: require('../../../assets/elements/order/pizza.png'), title: "Order Confirmed!", subtitle: isScheduledOrder
        ? `We will prepare your pizza fresh and have it ready at ${expected_ready_time}` : "Get ready... ultra sedap is coming your way!"
    },
    { stage: "ready_to_pickup", image: require('../../../assets/elements/home/home_pickup.png'), title: "Ready for Pickup", subtitle: "Come grab your ultra sedapp Pizza!" },
  ]

  const statusObj = status.find(obj => obj.stage === stage);

  return (
    <View style={styles.pickupstatusContainer}>
      <Text style={styles.etaText}>
        Expected to be ready at{' '}
        <Text
          style={{
            color: '#C2000E',
            fontFamily: 'Route159-Heavy',
            fontSize: 22,
          }}
        >
          {expected_ready_time}
        </Text>
      </Text>


      <View style={styles.pickupstatusSection}>

        <View style={styles.alignCenterContainer}>
          <Text style={styles.totalLabel}>Your Pickup No.</Text>
          <Text style={styles.pickupNo}>{item?.order_so ? (item.order_so).slice(-5) : ""}</Text>
        </View>
        <View style={styles.pickupIconContainer}>
          <View style={{ paddingBottom: '2%' }}>
            <AnimationImage
              // image={require('../../../assets/elements/profile/invoice.png')}
              image={statusObj?.image}
              containerStyle={styles.pickupStatusIconSection} />
          </View>

          <View style={styles.alignCenterContainer}>
            <Text style={styles.orderItemName}>{statusObj?.title}</Text>
            <Text style={styles.totalLabel}>{statusObj?.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* <AnimationImage image={require('../../../assets/elements/profile/invoice.png')} /> */}
    </View >
  )
}

const DineInStatus = ({ stage = "preparing", item, expected_ready_time }) => {
  const isScheduledOrder = item?.selected_date && item?.selected_time;

  // if (stage.toLocaleLowerCase() === "pending") {
  //   stage = "preparing";
  // }

  const status = [
    { stage: "completed", image: require('../../../assets/elements/home/recharge_gift.png'), title: "Order Completed", subtitle: "Thank you for your support! Come back for more Ultra Sedap!" },
    {
      stage: "preparing", image: require('../../../assets/elements/order/pizza.png'), title: "Preparing Order", subtitle:"Freshness in progress - just for you."
    },
    {
      stage: "pending", image: require('../../../assets/elements/order/pizza.png'), title: "Order Confirmed!", subtitle: "Get ready... ultra sedap is coming your way!"
    },
    { stage: "ready_to_serve", image: require('../../../assets/elements/home/home_pickup.png'), title: "Ready to Serve", subtitle: "Your pizza is ready to be served fresh & hot!" },
  ];

  const statusObj = status.find(obj => obj.stage === stage);

  return (
    <View style={styles.pickupstatusContainerDinein}>
      <Text style={styles.etaText}>
        Expected to be ready at{' '}
        <Text
          style={{
            color: '#C2000E',
            fontFamily: 'Route159-Heavy',
            fontSize: 22,
          }}
        >
          {expected_ready_time}
        </Text>
      </Text>

      <View style={styles.pickupstatusSection}>
        <View style={styles.pickupIconContainer}>
          <View style={{ paddingBottom: '2%' }}>
            <AnimationImage
              image={statusObj?.image}
              containerStyle={styles.pickupStatusIconSection}
            />
          </View>

          <View style={styles.alignCenterContainer}>
            <Text style={styles.orderItemName}>{statusObj?.title}</Text>
            <Text style={styles.totalLabel}>{statusObj?.subtitle}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};


const OrderSummary = ({ itemList }) => {
  const [isExpanded, setIsExpanded] = useState(false); // Collapsed by default
  const [isMoreThanOneItem, setIsMoreThanOneItem] = useState(false);


  useEffect(() => {
    setIsMoreThanOneItem(itemList.length > 1);
  }, [itemList.length]);

  return (
    <View style={styles.ordersummarySection}>
      <Text style={styles.sectionTitle}>Order Summary</Text>

      {/* Show only the first item when collapsed */}
      {!isExpanded ? <OrderItem item={itemList[0]} /> : null}

      {/* Show all items when expanded */}
      {isExpanded ? itemList.map((item) => (
        <OrderItem key={item.id} item={item} />
      )) : null}

      {/* "View All" link (collapsed state) */}
      {!isExpanded && isMoreThanOneItem ? (
        <TouchableOpacity onPress={() => setIsExpanded(true)}>
          <Text style={styles.viewAllLink}>View More Details</Text>
        </TouchableOpacity>
      ) : null}

      {/* "Collapse" link (expanded state) */}
      {isExpanded && isMoreThanOneItem ? (
        <TouchableOpacity onPress={() => setIsExpanded(false)}>
          <Text style={styles.viewAllLink}>View Less</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default function OrderDetails({ navigation }) {
  useAuthGuard();
  const router = useRouter();
  const { orderId } = useLocalSearchParams();
  const [driverPos, setDriverPos] = useState({
    latitude: pointA.latitude,
    longitude: pointA.longitude,
  });
  const markerRef = useRef(null);
  const mapRef = useRef(null);
  const [isActive, setIsActive] = useState(false);
  const [isDelivery, setIsDelivery] = useState(false);
  const [isPickup, setIsPickup] = useState(false);
  const [isDinein, setIsDinein] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [order, setOrder] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [podModalVisible, setPodModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [customerId, setCustomerId] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");
  const [orderType, setOrderType] = useState("");
  const [paymentMethodModalVisible, setPaymentMethodModalVisible] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);

  const paymentMethodsAll = [
    { id: 'wallet', name: 'US Pizza Wallet', icon: 'wallet', iconType: 'ionicons' },
    { id: 'razerpay', name: 'Online Payment', icon: require('../../../assets/elements/order/fiuu-icon.png'), iconType: 'image' },
  ];

  const handlePaymentModalClose = async () => {
    setShowPaymentScreen(false);
    const orderId = await AsyncStorage.getItem('orderId');
    router.replace(`/screens/orders/orders_details?orderId=${orderId}`);
  }

  const outletNameWithStatus = useMemo(() => {
    const name = outlets?.title || '';
    if (!name) return '';
    const isClosed = !!(outlets?.deleted_at && String(outlets.deleted_at).trim() !== '');
    return `${name}${isClosed ? ' (closed)' : ''}`;
  }, [outlets]);

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const customer_id = await AsyncStorage.getItem('customerData') ? JSON.parse(await AsyncStorage.getItem('customerData')).id : null;

        setAuthToken(authToken);
        setCustomerId(customer_id);
      } catch (err) {
        console.log(err);
      }
    };

    checkStoredData();
  }, [])

  const getOrder = async () => {

    if (orderId === null) {
      return;
    }
    try {
      const response = await axios.get(
        `${apiUrl}order/${orderId}/${customerId}`,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          }
        });
      const orderData = await response.data;
      const order_type = orderData.data?.order_type;
      setOrder(orderData.data);
      setIsPaid(String(orderData.data?.payment_status).toLowerCase() === "paid");
      // console.log(String(orderData.data?.payment_status).toLowerCase() === "paid");
      setIsActive(orderData.data?.status !== "completed" && orderData.data?.status !== "cancelled");
      setIsDelivery(order_type === "delivery");
      setIsPickup(order_type === "pickup");
      setIsDinein(order_type === "dinein");
      setOrderStatus(orderData.data?.status);
      setOrderType(order_type);
      // console.log(orderData.data);
    } catch (err) {
      console.log(err);
    }

  }

  useEffect(() => {
    if (authToken && orderId) {
      getOrder();
    }
  }, [authToken, orderId])

  useEffect(() => {
    // Only poll if order is not completed or cancelled
    if (orderId && order?.status !== "completed" && order?.status !== "cancelled") {
      const interval = setInterval(() => {
        getOrder();
      }, 60000); //

      // Cleanup interval on unmount or when order is completed/cancelled
      return () => clearInterval(interval);
    }

  }, [order, authToken, orderId]);

  useEffect(() => {
    const fetchAddresses = async () => {

      if (order?.customer_address_id) {
        try {
          const response = await axios.get(
            `${apiUrl}customer/address/detail/${order.customer_address_id}`,
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
              },
            });

          const addressData = await response.data;

          // console.log("Sorted Addresses:", addressData.data);
          setAddresses(addressData.data);
        } catch (error) {
          console.error('Error fetching addresses:', error);
        }
      }
    };

    const fetchOutlets = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}outlets2/${order.outlet_id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const outletData = await response.data;
        // console.log("Sorted Addresses:", sortedAddresses);
        setOutlets(outletData.result);
      } catch (error) {
        console.error('Error fetching addresses:', error);
      }
    };

    const fetchData = async () => {
      if (!authToken || !order?.customer_id) return;

      try {
        await Promise.all([
          fetchAddresses(),
          fetchOutlets(),
          // fetchMenu()
        ]);
      } catch (error) {
        console.error('Error in parallel fetching:', error);
      }
    };

    if (authToken && order) {
      fetchData();
    }
  }, [authToken, order]);

  const openWaze = (latitude, longitude) => {
    const url = `https://waze.com/ul?ll=${latitude},${longitude}&navigate=yes`;
    Linking.openURL(url);
  };

  const openGoogleMaps = (latitude, longitude) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  // const getAddress = (addressId) => {  

  // Memoize the driver animation to prevent unnecessary re-renders
  const animateDriver = useCallback(() => {
    let step = 0;
    const totalSteps = 100;
    const timer = setInterval(() => {
      step += 1;
      const lat =
        pointA.latitude +
        ((pointB.latitude - pointA.latitude) * step) / totalSteps;
      const lng =
        pointA.longitude +
        ((pointB.longitude - pointA.longitude) * step) / totalSteps;
      setDriverPos({ latitude: lat, longitude: lng });
      if (step >= totalSteps) clearInterval(timer);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // animate driver from A → B
  useEffect(() => {
    const cleanup = animateDriver();
    return cleanup;
  }, [animateDriver]);

  // Memoize static data to prevent re-renders
  const memoizedPointA = useMemo(() => pointA, []);
  const memoizedPointB = useMemo(() => pointB, []);

  const handleLalamoveTracking = async () => {
    if (!order?.deliveries?.[0]?.tracking_link) return;

    const trackingLink = order.deliveries[0].tracking_link;

    try {
      if (Platform.OS === 'web') {
        // Open in new tab with noopener/noreferrer for security
        window.open(trackingLink, '_blank', 'noopener,noreferrer');
      } else {
        // Mobile behavior (unchanged)
        await WebBrowser.openBrowserAsync(trackingLink, {
          toolbarColor: '#C2000E',
          controlsColor: 'white',
          dismissButtonStyle: 'close',
        });

        if (!WebBrowser.dismissBrowser()) {
          await Linking.openURL(trackingLink);
        }
      }
    } catch (err) {
      console.error('Redirect failed:', err);
      router.push('/orders');
    }
  };

  const handleOrderAgain = async () => {
    // console.log(order?.id);
    if (!order?.id) return;

    const orderId = order?.id;


    try {
      const response = await axios.post(
        `${apiUrl}order/again/${orderId}`,
        null,
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${authToken}`
          }
        });

      // console.log(response.data.data);
      if (response.data.status === 200) {
        const jsonOutletData = JSON.stringify({ outletId: response.data.data.outlet_id, outletTitle: response.data.data.outlet_title });
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
        const orderType = response.data.data.order_type;
        await AsyncStorage.setItem('orderType', orderType); // If order_type is a string, this is fine
        router.push('/screens/orders/checkout');
      }
    } catch (err) {
      console.error('Reorder failed:', err);
      // router.push('/orders');
    }
  }

  function getDeliveryTimeText(order) {
    // Check if we have valid date/time
    if (!order?.selected_date || !order?.selected_time) {
      return "ASAP (30 - 45min)";
    }

    try {
      // Parse the order date/time
      const [year, month, day] = order.selected_date.split('-');
      const [hours, minutes] = order.selected_time.split(':');

      const orderDateTime = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hours),
        parseInt(minutes)
      );

      // Get current date/time
      const now = new Date();

      // Compare and return appropriate string
      if (orderDateTime < now) {
        return "ASAP (30 - 45min)";
      } else {
        return `${order.selected_date}  ${order.selected_time}`;
      }
    } catch (error) {
      console.error("Error parsing date/time:", error);
      return "ASAP (30 - 45min)";
    }
  }

  const handlePayAgain = async (paymentMethod) => {
    try {
      const authToken = await AsyncStorage.getItem('authToken');

      console.log('Auth Token:', authToken);

      if (!authToken) {
        console.error('No authentication token found');
        return;
    }
      const response = await axios.post(
        `${apiUrl}payment/payagain/${order.id}`,
        { payment_method: paymentMethod },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const paymentData = await response.data;

      if (paymentData.status === 200) {
        const redirectUrl = paymentData.redirect_url;
        if (redirectUrl) {
          if (Platform.OS === 'web') {
            window.location.href = redirectUrl;
          } else {
            setPaymentUrl(redirectUrl);
            setShowPaymentScreen(true);
          }
        } else {
          router.push('/orders');
        }
      }
    } catch (error) {
      console.error('Error fetching payment details:', error);
    }
  };

  const message = () => {
    var text = '';
    switch (orderType) {
      case 'delivery':
        switch (orderStatus) {
          case 'pending':
            break;
          case 'confirmed':
            text = 'Get ready... ultra sedap is coming your way!';
            break;
          case 'on_the_way':
            text = 'Pizza is on the road! Countdown to Ultra Sedap';
            break;
          case 'preparing':
            text = 'Freshness in progress - just for you.'
            break;
          case 'completed':
            text = 'Thank you for your support! Come back for more Ultra Sedap!'
            break;
        }
        break;
      case 'pickup':
        switch (orderStatus) {
          case 'pending':
            break;
          case 'confirmed':
            text = 'Get ready... ultra sedap is coming your way!';
            break;
          case 'ready_to_pickup':
            text = 'Come grab your ultra sedapp Pizza!';
            break;
          case 'preparing':
            text = 'Freshness in progress - just for you.'
            break;
          case 'completed':
            text = 'Thank you for your support! Come back for more Ultra Sedap!'
            break;
        }
        break;
      case 'dinein':
        switch (orderStatus) {
          case 'pending':
          case 'confirmed':
            text = 'Order Confirmed!\nGet ready... ultra sedap is coming your way!';
            break;
          case 'ready_to_serve':
            text = 'Ready to Serve\nYour pizza is ready to be served fresh & hot!';
            break;
          case 'preparing':
            text = 'Preparing Order\nFreshness in progress - just for you.'
            break;
          case 'completed':
            text = 'Order Completed!\nThank you for your support! Come back for more Ultra Sedap!'
            break;
        }
        break;
    }

    return text;
  }


  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation
          title={
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={{ fontFamily: "Route159-Bold", fontSize: 18, color: "#C2000E" }}>
                TRACK YOUR ORDER
              </Text>
              <TouchableOpacity onPress={() => setReceiptModalVisible(true)} style={{ marginLeft: 12 }}>
                <FontAwesome name="file-text-o" size={22} color="#C2000E" />
              </TouchableOpacity>
            </View>
          }
          isBackButton={true}
          navigatePage={() => router.push('(tabs)/orders')}
        />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        // refreshControl={
        //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        // }
        >

          {/* Delivery Info */}
          {isDelivery && isActive && isPaid ? <View style={styles.deliveryInfo}>
            <Feather name="map-pin" size={20} color="#C2000E" />
            <Text style={styles.addressText}>
              {order ? addresses.address : " "}
            </Text>
          </View> : null}

          {/* Delivery Progress */}
          {isDelivery && isPaid ? <OrderProgressBar status={order.status} /> : null}

          {/* Pickup Progress */}
          {isPickup && isPaid ? <OrderProgressBar mode='pickup' status={order.status} /> : null}
          {/* Dinein Progress */}
          {isDinein && isPaid ? <OrderProgressBar mode='dinein' status={order.status} /> : null}

          {/* Dinein */}
          {isActive && isDinein && isPaid ? (<DineInStatus item={order} stage={order.status} expected_ready_time={order.expected_ready_time} />) : null}

          {/* Delivery */}
          {isActive && isDelivery && isPaid ? <DeliveryStatus item={order} stage={order.status} expected_ready_time={order.expected_ready_time} /> : null}

          {/* Pick up */}
          {isActive && isPickup && isPaid ? <PickupStatus item={order} stage={order.status} expected_ready_time={order.expected_ready_time} /> : null}

          {/* Prompt Payment */}
          {(isActive && !isPaid) ? <>
            <AnimationImage image={require('../../../assets/elements/home/home_pickup.png')} />

            <View style={styles.thankyouSection}>
              <View style={styles.thankyouRow}>
                <View>
                  <Image source={require('../../../assets/elements/home/home_dinein.png')} style={styles.thankyouIcon} />
                </View>

                <View>
                  <Text style={styles.orderItemName}>Pending Payment</Text>
                  <Text style={[styles.totalLabel, { width: '90%' }]}>Please make your payment to proceed</Text>
                </View>
              </View>
            </View>
          </> : null}      

          {/* Outlet Location */}
          <View style={[styles.detailTopSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>Your order from:</Text>
            <TouchableOpacity
              onPress={() => setMapModalVisible(true)}
              style={{ width: '52%' }}
            >
              <View style={styles.rowStyle}>
                <Text style={[styles.totalLabel, { width: '90%', justifyContent: 'flex-end' }]}>
                  {order ? outletNameWithStatus : null}
                </Text>
                <FontAwesome6
                  name={"store"}
                  size={14}
                  color={'#555'}
                  style={{ width: '10%' }}
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* Order ID */}
          {order?.order_so ? (<View style={[styles.detailSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>Your order ID:</Text>
            <Text style={styles.orderIDLabel}>{order.order_so}</Text>
          </View>) : null}

          {/* Selected Date Time */}
          {/* {!isDinein && order?.selected_date && order?.selected_time ? (<View style={[styles.detailSection, styles.totalRow]}> */}
          {!isDinein && isPaid ? (<View style={[styles.detailSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>{isDelivery ? "Deliver at:" : isPickup ? "Pick up at:" : "Order ready at:"}</Text>
            <Text style={styles.totalLabel}>{getDeliveryTimeText(order)}</Text>
          </View>) : null}

          {isDelivery ? ((!order?.deliveries?.[0]?.POD_url) ? null : (<View style={[styles.detailSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>Proof of Delivery:</Text>
            <TouchableOpacity onPress={() => setPodModalVisible(true)}>
              <Text style={{ color: '#555', textDecorationLine: 'underline' }}>View Proof of Delivery</Text>
            </TouchableOpacity>
            {/* <Text style={styles.orderIDLabel}>{order?.deliveries[0]?.POD_url}</Text> */}
          </View>)) : null}



          <ProofOfDeliveryModal
            visible={podModalVisible}
            imageUrl={order?.deliveries?.[0]?.POD_url}
            onClose={() => setPodModalVisible(false)}
          />

          {order ? <OrderSummary itemList={order.items} /> : null}

          {/* Payment Type*/}
          {isPaid ? (<View style={[styles.detailSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>Payment method</Text>
            <Text style={styles.totalLabel}>{order?.payments[0]?.payment_method
              ? order.payments[0].payment_method.charAt(0).toUpperCase() +
              order.payments[0].payment_method.slice(1)
              : null}
            </Text>
          </View>) : null}

          {/* Payment Status */}
          <View style={[styles.detailSection, styles.totalRow]}>
            <Text style={styles.orderItemName}>Payment status</Text>
            <View style={styles.paymentStatusContainer}>
              {order?.payment_status === 'paid' ? (
                <View style={[styles.paymentStatus, styles.paidStatus]}>
                  <FontAwesome name="check-circle" size={14} color="#28a745" />
                  <Text style={[styles.paymentStatusText, styles.paidText]}>Paid</Text>
                </View>
              ) : (
                <View style={[styles.paymentStatus, styles.unpaidStatus]}>
                  <FontAwesome name="clock-o" size={14} color="#ffc107" />
                  <Text style={[styles.paymentStatusText, styles.unpaidText]}>Unpaid</Text>
                </View>
              )}
            </View>
          </View>

          {/* Payment Details*/}
          <View style={styles.detailSection}>
            <View style={styles.totalRow}>
              <Text style={styles.orderItemName}>{isPaid ? "Payment Details" : "Order Details"}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Amount </Text>
              <Text style={styles.totalValue}>RM {order ? order.subtotal_amount : "0.00"}</Text>
            </View>
            {isDelivery ? <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Delivery Fee</Text>
              <Text style={styles.totalValue}>RM {order ? order.delivery_fee : "0.00"}</Text>
            </View> : null}
            {order?.voucher_discount_amount !== "0.00" || order?.promo_discount_amount !== "0.00" || order?.discount_amount !== "0.00" ? (<><View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Discount</Text>
              <Text style={styles.totalValue}>- RM {order?.voucher_discount_amount !== "0.00" ? (parseFloat(order?.voucher_discount_amount) + parseFloat(order?.discount_amount)).toFixed(2) : (parseFloat(order?.promo_discount_amount) + parseFloat(order?.discount_amount)).toFixed(2)}</Text>
            </View></>) : null}
            {order?.packaging_charge !== 0 ? (<View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Packaging Charges</Text>
              <Text style={styles.totalValue}>
                RM {order ? parseFloat(order.packaging_charge || 0).toFixed(2) : "0.00"}
              </Text>
            </View>) : null}
            {/* <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SST (6%)</Text>
              <Text style={styles.totalValue}>RM {order?.taxes[0] ? order?.taxes[0]?.tax_amount : "0.00"}</Text>
            </View> */}

            {order?.taxes && order.taxes.length > 0 ? (
              order.taxes.map((tax, index) => (
                <View style={styles.totalRow} key={index}>
                  <Text style={styles.totalLabel}>
                    Tax Charges ({parseInt(tax.tax_rate)}% {tax.tax_type})
                  </Text>
                  <Text style={styles.totalValue}>
                    RM {parseFloat(tax.tax_amount || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            ) : null}

          </View>

          <View style={styles.separator} />

          {/* Totals */}
          <View style={styles.totalsSection}>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>RM {order?.grand_total_before_rounding ? order?.grand_total_before_rounding : "0.00"}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Rounding Adj</Text>
              {/* <Text style={styles.totalValue}>RM {order?.rounding_amount}</Text> */}
              <Text style={styles.totalValue}>{order?.rounding_amount < 0 ? "- RM" : "RM"} {Math.abs(parseFloat(order?.rounding_amount || 0)).toFixed(2)}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.grandtotalTitle}>Grand Total</Text>
              <Text style={styles.grandtotalTitle}>RM {order ? order.grand_total : "0.00"}</Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{isPaid ? "Points Awarded" : "Earnable Points"}</Text>
              <Text style={styles.totalValue}>{order?.points ? `${order.points} Sedap Points` : ""} </Text>
            </View>
          </View>
          <View style={styles.grandtotalSection}>

          </View>


        </ScrollView>
        {/* Bottom Bar */}


        {/*if api return is_vip = 1 then hide the order again button */}
        {(order?.is_vip === 1 || order?.deliveries?.[1]?.tracking_link) ? null : (
          <View style={styles.bottomBar}>
            <TouchableOpacity
              style={{
                width: '100%',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => {
                if (!isPaid) {
                  setPaymentMethodModalVisible(true);
                } else if (isDelivery) {
                  handleLalamoveTracking();
                } else {
                  setMapModalVisible(true);
                }
              }}
            >
              <CustomTabBarBackground />
              <Text style={styles.placeOrderText}>
                {!isActive
                  ? "Order Again"
                  : (!isPaid
                    ? "Pay Again"
                    : isDelivery
                      ? "Track Order"
                      : "Get Outlet Direction")}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Modal
          transparent
          visible={mapModalVisible}
          animationType="fade"
          onRequestClose={() => setMapModalVisible(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)'
          }}>
            <View style={{
              backgroundColor: '#fff',
              borderRadius: 18,
              paddingVertical: 32,
              paddingHorizontal: 0,
              width: Math.min(width * 0.85, 360),
              alignItems: 'center',
            }}>
              <TouchableOpacity
                style={{
                  position: "absolute",
                  top: 3,
                  right: 16,
                  zIndex: 2,
                  padding: 4,
                }}
                onPress={() => setMapModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 26, color: "#999", fontWeight: "bold" }}>
                  ×
                </Text>
              </TouchableOpacity>
              <Text style={{
                fontWeight: 'bold',
                fontSize: 20,
                marginBottom: 30,
                textAlign: 'center',
                color: '#C2000E',
                fontFamily: 'Route159-HeavyItalic',
              }}>
                How would you like to{'\n'}get the direction?
              </Text>

              {/* --- Google Map --- */}
              <TouchableOpacity
                style={styles.modalCard}
                // onPress={() => handleOrderTypeSelect('d-in')}
                onPress={() => openGoogleMaps(outlets.latitude, outlets.longitude)}
                activeOpacity={0.8}
              >
                <View style={styles.modalCardLeft}>
                  <Image source={require('../../../assets/elements/order/googlemap.png')} style={styles.modalCardIcon} />
                </View>
                <View style={styles.modalCardRight}>
                  <Text style={styles.modalCardText}>Google Map</Text>
                </View>
              </TouchableOpacity>

              {/* --- Waze --- */}
              <TouchableOpacity
                style={[styles.modalCard, { marginTop: 20 }]}
                // onPress={() => handleOrderTypeSelect('pickup')}
                onPress={() => openWaze(outlets.latitude, outlets.longitude)}
                activeOpacity={0.8}
              >
                <View style={styles.modalCardLeft}>
                  <Image source={require('../../../assets/elements/order/waze.png')} style={styles.modalCardIcon} />
                </View>
                <View style={styles.modalCardRight}>
                  <Text style={styles.modalCardText}>Waze</Text>
                </View>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>

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
          visible={receiptModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReceiptModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                width: 320,
                backgroundColor: "#fff",
                borderRadius: 16,
                paddingVertical: 24,
                paddingHorizontal: 16,
                alignItems: "center",
              }}
            >
              {/* X Close Button */}
              <TouchableOpacity
                onPress={() => setReceiptModalVisible(false)}
                style={{
                  position: "absolute",
                  top: 10,
                  right: 12,
                  padding: 6,
                  zIndex: 1,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: "bold", color: "#999" }}>×</Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: "Route159-BoldItalic",
                  fontSize: 18,
                  marginBottom: 24,
                  textAlign: "center",
                  color: "#C2000E",
                }}
              >
                How would you like{"\n"}to get your receipt?
              </Text>

              {/* General Receipt */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  paddingVertical: 24,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  backgroundColor: "#e3e3e3",
                  marginBottom: 16,
                }}
                onPress={() => {
                  setReceiptModalVisible(false);
                  router.push(`/screens/orders/generalreceipt?orderId=${order.id}`);
                }}
              >
                <FontAwesome
                  name="file-text-o"
                  size={24}
                  color="#C2000E"
                  style={{ marginRight: 16 }}
                />
                <Text
                  style={{
                    fontFamily: "Route159-BoldItalic",
                    fontSize: 24,
                    color: "#C2000E",
                  }}
                >
                  General Receipt
                </Text>
              </TouchableOpacity>

              {/* IRBM e-Invoice */}
              {/* IRBM e-Invoice */}
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  width: "100%",
                  paddingVertical: 24,
                  paddingHorizontal: 24,
                  borderRadius: 12,
                  backgroundColor: "#e3e3e3",
                }}
                onPress={() => {
                  setReceiptModalVisible(false);

                  if (order?.zeoniq_loc_code && order.zeoniq_loc_code.trim() !== "") {
                    router.push(`/screens/orders/einvoice?orderId=${order.id}`);
                  } else {
                    const phoneNumber = "60173978341";
                    const message = encodeURIComponent(
                      `Hi, I would like to request an e-Invoice for my order ${order?.order_so || "(Order ID not found)"}.`
                    );
                    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
                    Linking.openURL(whatsappUrl);
                  }
                }}
              >
                <FontAwesome
                  name="file-text-o"
                  size={24}
                  color="#C2000E"
                  style={{ marginRight: 16 }}
                />
                <Text
                  style={{
                    fontFamily: "Route159-BoldItalic",
                    fontSize: 24,
                    color: "#C2000E",
                  }}
                >
                  IRBM e-Invoice
                </Text>
              </TouchableOpacity>

            </View>
          </View>
        </Modal>
        <Modal
          visible={paymentMethodModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPaymentMethodModalVisible(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
            }}
          >
            <View
              style={{
                width: 320,
                backgroundColor: '#fff',
                borderRadius: 16,
                paddingVertical: 24,
                paddingHorizontal: 16,
                alignItems: 'center',
              }}
            >
              <TouchableOpacity
                onPress={() => setPaymentMethodModalVisible(false)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 12,
                  padding: 6,
                  zIndex: 1,
                }}
              >
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#999' }}>×</Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontFamily: 'Route159-BoldItalic',
                  fontSize: 18,
                  marginBottom: 24,
                  textAlign: 'center',
                  color: '#C2000E',
                }}
              >
                Choose Payment Method
              </Text>

              {/* Dynamically render payment methods */}
              {paymentMethodsAll.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-start',
                    alignItems: 'center',
                    width: '100%',
                    paddingVertical: 16,
                    paddingHorizontal: 24,
                    borderRadius: 12,
                    backgroundColor: '#e3e3e3',
                    marginBottom: 16,
                  }}
                  onPress={() => {
                    setPaymentMethodModalVisible(false);
                    handlePayAgain(method.id);
                  }}
                >
                  {method.iconType === 'ionicons' ? (
                    <Ionicons name={method.icon} size={32} color="#C2000E" style={{ marginRight: 32 }} />
                  ) : (
                    <Image source={method.icon} style={{ width: 48, height: 48, marginRight: 24, resizeMode: 'contain' }} />
                  )}
                  <Text
                    style={{
                      fontFamily: 'Route159-BoldItalic',
                      fontSize: 18,
                      color: '#C2000E',
                    }}
                  >
                    {method.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </ResponsiveBackground>

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
    flexShrink: 1,
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
  pickupstatusContainer: {
    paddingHorizontal: 22,
    marginTop: '-2%',
  },
  pickupstatusContainerDinein: {
    paddingHorizontal: 22,
    marginTop: '3%',
  },
  pickupIconContainer: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'white',
    width: '95%',
    marginTop: '5%',
    paddingBottom: '8%',
    borderRadius: 12,
  },
  alignCenterContainer: {
    alignItems: 'center',
    alignSelf: 'center'
  },
  etaText: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    marginBottom: 8,
    color: '#727171',
  },
  etaTextDinein: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    marginBottom: 8,
    paddingLeft: '3%',
    color: '#727171',
  },
  section: {
    padding: 16,
  },
  viewAllLink: {
    color: '#70B8FF',
    textDecorationLine: 'underline',
    // marginTop: 8,
    alignSelf: 'center',
  },
  orderSummaryTitle: {
    width: '70%',
    marginBottom: 12,
  },
  ordersummarySection: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  detailSection: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  detailTopSection: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: '3%'
  },
  thankyouSection: {
    paddingHorizontal: 20,
    backgroundColor: 'rgb(243, 243, 243)',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginTop: 8,
    // alignContent: 'center',
    justifyContent: 'center',
    // alignItems: 'flex-start'
  },
  pickupstatusSection: {
    paddingHorizontal: 20,
    // backgroundColor: '#FFF5F5',
    backgroundColor: 'rgb(243, 243, 243)',
    width: '95%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: '6%',
    marginTop: 8,
    // alignContent: 'center',
    justifyContent: 'center',
    // alignItems: 'flex-start'
  },
  orderDetailsIconSection: {
    paddingHorizontal: 20,
    backgroundColor: '#FFF5F5',
    width: '90%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 16,
    marginVertical: 8,
    // alignContent: 'center',
    justifyContent: 'center',
    // alignItems: 'flex-start'
  },
  pickupStatusIconSection: {
    paddingHorizontal: 20,
    // backgroundColor: 'rgb(250, 250, 250)',
    backgroundColor: 'white',
    width: '70%',
    alignSelf: 'center',
    borderRadius: 12,
    paddingVertical: 10,
    marginVertical: 8,
    // alignContent: 'center',
    justifyContent: 'center',
    // alignItems: 'flex-start'
  },
  thankyouRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 15,
    alignSelf: 'flex-start',
    alignItems: 'center',
    // alignContent: 'center',
    // justifyContent: 'center'
  },
  thankyouIcon: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  orderDetailsIcon: {
    width: 85,
    height: 85,
    resizeMode: 'contain',
    alignSelf: 'center'
  },
  sectionTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 16) : 16) : 18,
    color: '#C2000E',
    marginBottom: 12,
  },
  grandtotalTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 16) : 16) : 18,
    color: '#C2000E',
    marginVertical: '2%',
  },
  sectionSubtitle: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  separator: {
    height: 0.5,
    backgroundColor: '#C2000E',
    marginHorizontal: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    // justifyContent: 'center',
  },
  orderItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderItemBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 8,
  },
  orderItemImage: {
    width: 85,
    height: 90,
    borderRadius: 8,
    // alignSelf: 'center',
  },
  orderItemDetails: {
    flex: 1,
    marginLeft: 12,
    flexDirection: 'column',
    minHeight: 115,
    paddingVertical: 3,
  },
  orderItemName: {
    fontFamily: 'Route159-Bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 15 : 16) : 16) : 16,
    color: '#C2000E',
    minHeight: 20,
    lineHeight: 20,
  },
  pickupNo: {
    fontFamily: 'Route159-Bold',
    fontSize: 28,
    color: '#C2000E',
    minHeight: 20,
    // lineHeight: 15,
  },
  orderItemPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    width: '110%',
  },
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
    minHeight: 20,
    lineHeight: 16,
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
    fontSize: 11,
    color: '#727171',
  },
  itemOption: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 8 : 9) : 9) : 10,
    color: '#727171',
    alignSelf: 'flex-start',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginTop: 2,
  },
  optionTitle: {
    flex: 1,
    marginRight: 6,
  },
  optionPrice: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 10,
    color: '#727171',
    textAlign: 'right',
  },
  moreOptionsButton: {
    marginTop: 4,
    alignSelf: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  moreOptionsText: {
    fontSize: 10,
    color: '#C2000E',
    marginLeft: '2%',
    flexShrink: 1,
  },
  optionsModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  optionsModalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 18,
  },
  optionsModalTitle: {
    fontFamily: 'Route159-Bold',
    fontSize: 18,
    color: '#C2000E',
    marginBottom: 12,
    textAlign: 'center',
  },
  optionsModalList: {
    maxHeight: 240,
  },
  optionsModalListContent: {
    paddingBottom: 12,
  },
  optionsModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  optionsModalOption: {
    flex: 1,
    marginRight: 12,
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 13,
    color: '#333',
  },
  optionsModalPrice: {
    fontFamily: 'Route159-Bold',
    fontSize: 12,
    color: '#C2000E',
  },
  optionsModalCloseButton: {
    marginTop: 16,
    alignSelf: 'center',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: '#C2000E',
  },
  optionsModalCloseText: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#fff',
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
  totalsSection: {
    padding: 16,
  },
  notPaidTotalsSection: {
    paddingTop: 0,
  },
  grandtotalSection: {
    paddingHorizontal: 16,
    paddingVertical: 8
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowStyle: {
    flexDirection: 'row',
    // gap: 5
  },
  totalLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    color: '#555',
    justifyContent: 'flex-end'
  },
  orderIDLabel: {
    fontFamily: 'RobotoSlab-Regular',
    fontSize: 14,
    textDecorationLine: 'underline',
    color: '#555',
  },
  totalValue: {
    fontFamily: 'Route159-Bold',
    fontSize: 14,
    color: '#555',
  },
  voucherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
  },
  voucherText: {
    flex: 1,
    marginLeft: 12,
    fontFamily: 'Route159-Bold',
    fontSize: 16,
    color: '#C2000E',
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
    fontFamily: 'Route159-Heavy',
    // fontSize: 20,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 18 : 18) : 18) : 20,
    color: '#fff',
    marginBottom: 20,
  },
  modalCard: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: '#e3e3e3',
    borderRadius: 14,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 18,
    width: 280,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    // alignSelf: 'center',
    justifyContent: 'center'
  },
  modalCardLeft: {
    marginRight: 20,
    alignItems: 'center',
    justifyContent: 'center',
    // alignItems: 'center'
  },
  modalCardIcon: {
    width: 58,
    height: 58,
    resizeMode: 'contain',
  },
  modalCardRight: {
    flex: 1,
    justifyContent: 'center',
    // alignItems: 'center'
  },
  modalCardText: {
    fontSize: 22,
    color: '#C2000E',
    fontWeight: 'bold',
    letterSpacing: 1.2,
    fontFamily: 'Route159-HeavyItalic',
  },
  map: { flex: 1, height: 250, borderRadius: 12 },
  driverIcon: { width: 50, height: 50 },
  paymentStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  paymentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paidStatus: {
    backgroundColor: '#e8f5e9', // Light green background
    borderColor: '#a5d6a7', // Green border
    borderWidth: 1,
  },
  unpaidStatus: {
    backgroundColor: '#fff3cd', // Light yellow background
    borderColor: '#ffeeba', // Yellow border
    borderWidth: 1,
  },
  paymentStatusText: {
    fontSize: 12,
    fontFamily: 'Route159-Regular',
    marginLeft: 5,
  },
  paidText: {
    color: '#28a745', // Green text
  },
  unpaidText: {
    color: '#ffc107', // Yellow text
  },
});
