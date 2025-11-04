import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View, Modal } from 'react-native';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { apiUrl, imageUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { FontAwesome6 } from '@expo/vector-icons';
import CustomDateTimePickerModal from '../../../components/ui/CustomDateTimePickerModal';
import useAuthGuard from '../../auth/check_token_expiry';
import MenuItem from '../../../components/menu/MenuItem';
import CategoryItem from '../../../components/menu/CategoryItem';

const { width } = Dimensions.get('window');

const orderTypes = [
  { key: 'dinein', label: 'Dine In' },
  { key: 'pickup', label: 'Pick Up' },
  { key: 'delivery', label: 'Delivery' },
];

const getOrderTypeLabel = (key) => {
  const orderType = orderTypes.find(type => type.key === key);
  return orderType ? orderType.label : key;
};

const isWeb = Platform.OS === 'web';

const getCategoryToIndexMap = (items) => {
  const map = {};
  items.forEach((item, idx) => {
    if (Array.isArray(item.categoryIds)) {
      item.categoryIds.forEach(catId => {
        const key = String(catId);
        if (map[key] === undefined) map[key] = idx;
      });
    }
  });
  return map;
};




export default function MenuScreen() {
  useAuthGuard();
  // const [activeCategory, setActiveCategory] = useState(categories[0].key);
  // const { outletId, distance, outletTitle } = useLocalSearchParams();
  const [activeCategory, setActiveCategory] = useState('');
  const [activeOrderType, setActiveOrderType] = useState(orderTypes[0].key);
  const [categoryLock, setCategoryLock] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const menuListRef = useRef(null);
  const categoryListRef = useRef(null);
  const router = useRouter();
  // const [menuData, setMenuData] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const categoryToIndex = useMemo(() => getCategoryToIndexMap(menuItems), [menuItems]);
  const categoryLockRef = useRef(categoryLock);
  const categoriesRef = useRef(categories);
  const menuItemsRef = useRef(menuItems);
  const [selectedOutlet, setSelectedOutlet] = useState({});
  const [showDateTimePicker, setShowDateTimePicker] = useState(false);
  const [selectedDateTime, setSelectedDateTime] = useState(null);
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState({});
  // const [estimatedTime, setEstimatedTime] = useState({});
  const [customer, setCustomer] = useState('');
  const isProgrammaticScroll = useRef(false);
  const [listReady, setListReady] = useState(false);
  //modal for confirm order type change
  const [confirmOrderTypeModalVisible, setConfirmOrderTypeModalVisible] = useState(false);
  const [pendingOrderType, setPendingOrderType] = useState(null);
  const { order_type, outlet_id } = useLocalSearchParams();

  useEffect(() => {
  const handleQR = async () => {
    if (!order_type || !outlet_id) return;

    await checkoutClearStorage();

    await AsyncStorage.setItem("orderType", String(order_type));
    await AsyncStorage.setItem(
      "outletDetails",
      JSON.stringify({ outletId: String(outlet_id) })
    );
    console.log("QR scanned:", order_type, outlet_id);

    setSelectedOutlet({ outletId: String(outlet_id) });

    fetchOutletInfo(outlet_id);

      const outletDetailsString = await AsyncStorage.getItem("outletDetails");
      if (outletDetailsString) {
        const outletDetails = JSON.parse(outletDetailsString);
        if (order_type === "dinein" && outletDetails.isOperate === false) {
          setShowDateTimePicker(true);
        }
      }
    };

    handleQR();
  }, [order_type, outlet_id]);


  const fetchOutletInfo = async (id) => {
    try {
      const token = await AsyncStorage.getItem("authToken");

      const res = await axios.get(`${apiUrl}outlets/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.data?.status === 200) {
        const outlet = res.data.data;

        const outletObj = {
          outletId: String(outlet.id),
          outletTitle: outlet.title,
          distanceFromUserLocation: outlet.distance_km ?? "0.00",
          isOperate: outlet.is_operated ?? true
        };

        await AsyncStorage.setItem("outletDetails", JSON.stringify(outletObj));
        setSelectedOutlet(outletObj);

        const orderType = await AsyncStorage.getItem("orderType");
        if (orderType === "dinein" && outletObj.isOperate === false) {
          setShowDateTimePicker(true);
        }

        console.log("Outlet info:", outletObj);
      }
    } catch (err) {
      console.log("error:", err?.response?.data || err.message);
    }
  };






  const categoryListPerfProps = useMemo(() => {
    if (isWeb) {
      const total = Math.max(1, categories.length);
      return {
        removeClippedSubviews: false,
        initialNumToRender: total,
        maxToRenderPerBatch: total,
        windowSize: Math.max(10, total),
      };
    }
    return {
      removeClippedSubviews: true,
      initialNumToRender: 10,
      maxToRenderPerBatch: 10,
      windowSize: 10,
      updateCellsBatchingPeriod: 50,
    };
  }, [categories.length]);

  const menuListPerfProps = useMemo(() => {
    if (isWeb) {
      const total = Math.max(12, menuItems.length || 0);
      return {
        removeClippedSubviews: false,
        initialNumToRender: total,
        maxToRenderPerBatch: total,
        windowSize: total,
      };
    }
    return {
      removeClippedSubviews: true,
      initialNumToRender: 12,
      windowSize: 10,
      maxToRenderPerBatch: 10,
      updateCellsBatchingPeriod: 100,
    };
  }, [menuItems.length]);

  const handleSetOrderType = async (orderType) => {
    setActiveOrderType(orderType);
    try {
      await AsyncStorage.setItem('orderType', orderType);
    }
    catch (err) {
      console.log(err.response.data.message);
    }
  }

  const requestOrderTypeChange = useCallback((nextType) => {
    if (nextType === activeOrderType) return;
    setPendingOrderType(nextType);
    setConfirmOrderTypeModalVisible(true);
  }, [activeOrderType]);

  const confirmOrderTypeChange = useCallback(() => {
    if (pendingOrderType) {
      handleSetOrderType(pendingOrderType);
      if (pendingOrderType !== "dinein") {
        setShowDateTimePicker(false);
      }
    }
    setConfirmOrderTypeModalVisible(false);
    setPendingOrderType(null);
  }, [pendingOrderType]);


  const cancelOrderTypeChange = useCallback(() => {
    setConfirmOrderTypeModalVisible(false);
    setPendingOrderType(null);
  }, []);

  const setAsyncEstimatedTime = async ({ estimatedTime, date, time }) => {

    let estimatedTimeDetail = {
      estimatedTime,
      date,
      time
    };
    try {
      await AsyncStorage.setItem('estimatedTime', JSON.stringify(estimatedTimeDetail));
    }
    catch (err) {
      console.log(err.response.data.message);
    }
  }

  useEffect(() => {
    const fetchOutletData = async () => {
      try {
        const outletDetails = await AsyncStorage.getItem('outletDetails');
        const estimatedTime = await AsyncStorage.getItem('estimatedTime');
        console.log(!estimatedTime);
        let is_over = false;
        //check now over estimated time
        if (estimatedTime) {
          const parsedEstimatedTime = JSON.parse(estimatedTime);
          const currentTime = new Date();
          const estimatedTimeObj = new Date(`${parsedEstimatedTime.date} ${parsedEstimatedTime.time}`);
          if (currentTime >= estimatedTimeObj && parsedEstimatedTime.estimatedTime !== "ASAP") {
            is_over = true;
          }
        }
        if (outletDetails) {
          const parsedOutletDetails = JSON.parse(outletDetails);
          console.log(parsedOutletDetails);
          if (parsedOutletDetails.isHQ === undefined) {
            // console.log(outletDetails.outletId); 
            setSelectedOutlet(parsedOutletDetails);
            if ((activeOrderType !== "dinein" && !estimatedTime) || is_over) {
              setShowDateTimePicker(true);
            }
          } else {
            router.push('/');
          }
        }
        else {
          router.push('/screens/home/outlet_select');
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    fetchOutletData();

    const fetchEstimatedTime = async () => {
      try {
        const estimatedTime = await AsyncStorage.getItem('estimatedTime');
        if (estimatedTime) {
          const parsedEstimatedTime = JSON.parse(estimatedTime);

          setSelectedDateTime(parsedEstimatedTime.estimatedTime);
          // setEstimatedtime(parsedOutletDetails);
        }
        else {
          setSelectedDateTime("ASAP");
        }
      } catch (err) {
        console.log(err?.response?.data?.message);
      }
    }
    fetchEstimatedTime();

    const fetchAddressData = async () => {
      try {
        const deliveryAddressDetails = await AsyncStorage.getItem('deliveryAddressDetails');
        if (deliveryAddressDetails) {
          const parsedAddressDetails = JSON.parse(deliveryAddressDetails);
          // console.log(outletDetails.outletId); 
          setSelectedDeliveryAddress(parsedAddressDetails);
        }
        else if (!deliveryAddressDetails && activeOrderType === "delivery") {
          router.push('/screens/home/address_select');
        }
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    fetchAddressData();

  }, [router, activeOrderType, selectedDateTime])

  useEffect(() => {
    const fetchOrderType = async () => {
      try {
        const orderType = await AsyncStorage.getItem('orderType');
        setActiveOrderType(orderType);
      } catch (err) {
        console.log(err.response.data.message);
      }
    }
    fetchOrderType();

  }, [router, activeOrderType])

  useEffect(() => {
    categoryLockRef.current = categoryLock;
  }, [categoryLock]);

  useEffect(() => {
    categoriesRef.current = categories;
  }, [categories]);

  useEffect(() => {
    menuItemsRef.current = menuItems;
  }, [menuItems]);

  const activeCategoryRef = useRef(activeCategory);
  const viewabilityConfigRef = useRef({ itemVisiblePercentThreshold: 50 });
  useEffect(() => {
    activeCategoryRef.current = activeCategory != null ? String(activeCategory) : '';
  }, [activeCategory]);

  const handleViewableItemsChanged = useCallback(({ viewableItems }) => {
    if (categoryLockRef.current || isProgrammaticScroll.current) return; // 🔒 skip updates while lock is active
    // console.log(123)
    if (viewableItems.length > 0) {
      const mostVisibleItem = [...viewableItems].sort((a, b) =>
        b.percentVisible - a.percentVisible
      )[0].item;

      const firstCatIdRaw = mostVisibleItem.categoryIds?.[0];
      const firstCatId = firstCatIdRaw != null ? String(firstCatIdRaw) : '';
      if (firstCatId && firstCatId !== activeCategoryRef.current) {
        activeCategoryRef.current = firstCatId;
        setActiveCategory(firstCatId);

        const catIdx = categoriesRef.current.findIndex(c => c.key === firstCatId);
        if (catIdx !== -1 && categoryListRef.current) {
          categoryListRef.current.scrollToIndex({
            index: catIdx,
            viewPosition: 0.5,
            animated: true,
          });
        }
      }
    }
  }, []);

  const viewabilityConfigCallbackPairs = useMemo(
    () => [
      {
        viewabilityConfig: viewabilityConfigRef.current,
        onViewableItemsChanged: handleViewableItemsChanged,
      },
    ],
    [handleViewableItemsChanged]
  );

  const isFirstInCategory = useCallback((items, index, activeCat) => {
    if (index === 0) return true;
    // Show divider if previous item does not include the same activeCat
    return !items[index - 1].categoryIds?.includes(activeCat);
  }, []);

  // Memoized callback functions to prevent recreation on every render
  const handleMenuItemPress = useCallback((itemId) => {
    router.push({
      pathname: '/screens/menu/menu_item',
      params: { id: itemId },
      source: 'add'
    });
  }, [router]);

  const APPROX_ITEM_HEIGHT = 152; // your normal row height (without extra header)
  const LOCK_RELEASE_MS = 1200;
  const releaseCategoryLock = useCallback(() => {
    categoryLockRef.current = false;
    setCategoryLock(false);
    isProgrammaticScroll.current = false;
  }, []);

  const handleCategoryPressCallback = useCallback((catKey) => {
    const normalizedKey = String(catKey);
    // highlight the tapped category immediately
    activeCategoryRef.current = normalizedKey;
    setActiveCategory(normalizedKey);
    setCategoryLock(true);
    isProgrammaticScroll.current = true;
    if (!listReady) {
      return;
    }

    // 1) Scroll the left category list to keep the tapped item centered
    const catIdx = categoriesRef.current.findIndex(c => c.key === normalizedKey);
    if (catIdx !== -1 && categoryListRef.current) {
      try {
        categoryListRef.current.scrollToIndex({
          index: catIdx,
          viewPosition: 0.5,
          animated: true,
        });
      } catch (err) {
        // soft fallback
        categoryListRef.current.scrollToOffset({
          offset: Math.max(0, catIdx * 90 - 90),
          animated: true,
        });
      }
    }

    // 2) Scroll the menu list to the first item for this category (the "title" lives with that row)
    let index = categoryToIndex[normalizedKey];
    if (index == null || !menuListRef.current) {
      setTimeout(releaseCategoryLock, LOCK_RELEASE_MS);
      return;
    }
    index -= 0.05;
    // Let layout settle, then attempt precise jump
    requestAnimationFrame(() => {
      try {
        menuListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0,      // align the category title at the top
          viewOffset: 0,
        });
      } catch (err) {
        // If not measured yet, do an approximate offset first…
        const roughOffset = Math.max(0, index * APPROX_ITEM_HEIGHT - APPROX_ITEM_HEIGHT);
        menuListRef.current.scrollToOffset({ offset: roughOffset, animated: false });

        // …then retry the precise jump shortly after
        setTimeout(() => {
          try {
            menuListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0,
            });
          } catch {
            // give up gracefully — user can still scroll manually
          }
        }, 120);
      } finally {
        setTimeout(releaseCategoryLock, LOCK_RELEASE_MS);
      }
    });
  }, [categoryToIndex, listReady, releaseCategoryLock]);

  // Memoized key extractors
  const categoryKeyExtractor = useCallback((item, index) => `${item.key}_${index}`, []);
  const menuKeyExtractor = useCallback((item, index) => `${item.id}_${index}`, []);
  // Memoized render functions
  const disabledCategoryStyle = useMemo(
    () => (!listReady ? styles.categoryDisabled : undefined),
    [listReady]
  );

  const categoriesWithActive = useMemo(
    () =>
      categories.map(cat => ({
        ...cat,
        isActive: String(activeCategory) === cat.key,
      })),
    [categories, activeCategory]
  );

  const renderCategoryItem = useCallback(({ item }) => (
    <CategoryItem
      item={item}
      isActive={item.isActive}
      onPress={listReady ? handleCategoryPressCallback : undefined} // 🔒 disable taps
      disabled={!listReady}
      style={disabledCategoryStyle}
    />
  ), [disabledCategoryStyle, handleCategoryPressCallback, listReady]);

  const renderMenuItem = useCallback(({ item, index }) => {
    const isFirst = isFirstInCategory(menuItems, index, item.categoryIds?.[0]);
    return (
      <MenuItem
        item={item}
        index={index}
        isFirstInCategory={isFirst}
        categories={categories}
        customer={customer}
        onPress={handleMenuItemPress}
      />
    );
  }, [menuItems, categories, customer, handleMenuItemPress, isFirstInCategory]);

  useEffect(() => {
    // Release the lock after a short delay to allow animations to complete
    if (categoryLock) {
      const timer = setTimeout(() => setCategoryLock(false), 800);
      return () => clearTimeout(timer);
    }
  }, [categoryLock]);

  const checkoutClearStorage = async () => {
    const keysToRemove = [
      'estimatedTime',
      'deliveryAddressDetails',
      'orderType',
      'outletDetails',
      'paymentMethod'
    ];

    try {
      console.log('Attempting to clear:', keysToRemove);

      // First verify what's actually in storage
      const currentStorage = await AsyncStorage.multiGet(keysToRemove);
      console.log('Current storage before clear:', currentStorage);

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

      console.log('Storage cleared successfully');
      return true;
    } catch (err) {
      console.error('Clearance error:', err);
      return false;
    }
  };

  const fetchMenuData = useCallback(
    async ({ resetList = false } = {}) => {
      if (!selectedOutlet?.outletId) return;

      try {
        const shouldResetList = resetList && !isWeb;
        if (shouldResetList) {
          categoryLockRef.current = false;
          isProgrammaticScroll.current = false;
          setCategoryLock(false);
          setListReady(false);

          requestAnimationFrame(() => {
            categoryListRef.current?.scrollToOffset({ offset: 0, animated: false });
            menuListRef.current?.scrollToOffset({ offset: 0, animated: false });
          });
        }

        const token = await AsyncStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await axios.get(`${apiUrl}menu/all/${selectedOutlet.outletId}`, { headers });

        const fetchedCategories = (response.data.Categories || []).map(cat => ({
          key: String(cat.id),
          label: cat.title,
          icon: cat.image_url
            ? { uri: imageUrl + "menu_categories/" + cat.image_url }
            : require('../../../assets/icons/burger.png'),
        }));
        setCategories(fetchedCategories);

        const fetchedItems = (response.data.Items || []).map(item => {
          const imageUrlFull =
            item.images && item.images.length > 0 && item.images[0].image_url
              ? imageUrl + "menu_images/" + item.images[0].image_url
              : null;

          const mappedTags = (item.tags || []).map(tag => ({
            id: tag.id,
            title: tag.title,
            icon: tag.icon_url
              ? { uri: imageUrl + "tags/" + tag.icon_url }
              : require('../../../assets/icons/burger.png'),
          }));
          // console.log(item);

          return {
            id: item.id,
            name: item.title,
            description: item.short_description,
            price: item.price,
            discount_price: item.discount_price,
            image: imageUrlFull,
            categoryIds: (item.category_ids || []).map(id => String(id)),
            tags: mappedTags,
            is_available: item.is_available,
            membership_tier: item.membership_tier,
          };
        });
        setMenuItems(fetchedItems);
        setListReady(fetchedItems.length > 0);

        if (fetchedCategories.length > 0) {
          setActiveCategory(prev => {
            const prevKey = prev != null ? String(prev) : '';
            if (prevKey && fetchedCategories.some(cat => cat.key === prevKey)) {
              return prevKey;
            }
            return fetchedCategories[0].key;
          });
        } else {
          setActiveCategory('');
        }
      } catch (err) {
        console.log('Error fetching menu data:', err.response?.data || err.message);
        setListReady(menuItemsRef.current.length > 0);
      }
    },
    [selectedOutlet?.outletId]
  );

  useFocusEffect(
    useCallback(() => {
      if (isWeb) {
        fetchMenuData({ resetList: false });
      } else {
        fetchMenuData({ resetList: true });
      }
    }, [fetchMenuData])
  );

  useEffect(() => {
    if (selectedOutlet?.outletId) {
      fetchMenuData({ resetList: !isWeb });
    }
  }, [selectedOutlet?.outletId, fetchMenuData]);

  function limitDecimals(value, maxDecimals = 7) {
    if (!value) return "";
    const num = parseFloat(value);
    return Math.floor(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  }

  // console.log('Request params:', {
  //   customer_id: customer.id,
  //   outlet_id: selectedOutlet.outletId
  // });
  const formatDateTime = useCallback(() => {
    // console.log('selectedDateTime', selectedDateTime);
    if (!selectedDateTime) return;

    const now = new Date();
    let finalDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let finalTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (selectedDateTime.split(" ").length > 1) {
      const [dayLabel, timeString] = selectedDateTime.split(" ");
      let selectedDate = new Date();

      if (dayLabel.toLowerCase() === "today") {
        const [hours, minutes] = timeString.split(":").map(Number);
        selectedDate.setHours(hours, minutes, 0, 0);
        const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        if (selectedDate > oneHourFromNow) {
          finalDate = selectedDate.toISOString().split("T")[0];
          finalTime = `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`;
        }
      } else {
        [finalDate, finalTime] = convertToDateTimeString(selectedDateTime);
      }
    }

    setAsyncEstimatedTime({ estimatedTime: selectedDateTime, date: finalDate, time: finalTime });
    return { estimatedTime: selectedDateTime, date: finalDate, time: finalTime };
  }, [selectedDateTime]);

  const fetchCartTotal = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const customerData = await AsyncStorage.getItem('customerData');
      const customer = customerData ? JSON.parse(customerData) : null;
      setCustomer(customer);

      // if (!token || !customer?.id || !selectedOutlet?.outletId) {
      //   return 0;
      // }
      if (!token || !customer?.id) {
        return 0;
      }

      if (!selectedOutlet?.outletId) {
        return 0;
      }

      const estimatedTimeObj = formatDateTime();
      // console.log('estimatedTimeObj', estimatedTimeObj);
      const response = await axios.get(`${apiUrl}cart/get`, {
        params: {
          customer_id: customer.id,
          outlet_id: selectedOutlet.outletId,
          address: selectedDeliveryAddress ? selectedDeliveryAddress.address : "",
          order_type: activeOrderType,
          latitude: selectedDeliveryAddress ? limitDecimals(selectedDeliveryAddress.latitude) : "",
          longitude: selectedDeliveryAddress ? limitDecimals(selectedDeliveryAddress.longitude) : "",
          selected_date: estimatedTimeObj.estimatedTime === "ASAP" ? null : estimatedTimeObj.date,
          selected_time: estimatedTimeObj.estimatedTime === "ASAP" ? null : estimatedTimeObj.time,
          // selected_date: estimatedTimeObj.date,
          // selected_time: estimatedTimeObj.time,
        },
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data?.status === 200 && response.data?.data?.order_summary) {
        return parseFloat(response.data.data.order_summary.subtotal_amount) || 0;
      }
      return 0;
    } catch (error) {
      // console.log(error);
      if (error?.response?.status === 400) {

        // Skip redirect if cart is empty (likely first visit)
        if (error?.response?.data?.message?.includes("Cart is empty")) {
          return 0;
        }

        if (error?.response?.data?.status === 405) {
          router.push({ pathname: '(tabs)', params: { setErrorModal: true } });
          checkoutClearStorage();
        }
      }

    }
  }, [selectedOutlet, selectedDeliveryAddress, activeOrderType, router, formatDateTime]);

  useEffect(() => {
    const loadCartTotal = async () => {
      const total = await fetchCartTotal();
      setTotalPrice(total);
    };
    loadCartTotal();
  }, [selectedOutlet, fetchCartTotal]);

  useFocusEffect(
    useCallback(() => {
      const loadCartTotal = async () => {
        const total = await fetchCartTotal();
        setTotalPrice(total);
      };
      loadCartTotal();
    }, [fetchCartTotal])
  );

  function convertToDateTimeString(input) {
    // input format: "Jul 31 14:00"
    const [monthStr, dayStr, timeStr] = input.split(" "); // "Jul", "31", "14:00"
    const [hours, minutes] = timeStr.split(":").map(Number);

    // Create a Date object using current year
    const now = new Date();
    const year = now.getFullYear();

    // Parse month string to month index (0-11)
    const monthIndex = new Date(`${monthStr} 1, ${year}`).getMonth();

    // Create date
    const date = new Date(year, monthIndex, Number(dayStr), hours, minutes);

    // Format as "YYYY-MM-DD HH:MM"
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return [`${yyyy}-${mm}-${dd}`, `${hh}:${min}`];
  }

  const handleCheckout = () => {
    formatDateTime();
    router.push('/screens/orders/checkout');
  };


  return (
    <ResponsiveBackground>
      {/* <View style={commonStyles.outerWrapper}>
      <View style={commonStyles.contentWrapper}> */}
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: '#fff'
        }}
        edges={['top', 'left', 'right']}
      >
        {/* Top Bar */}
        <TopNavigation title="MENU" isBackButton={false} />

        {/* Order Type Tabs */}
        <View style={styles.orderTypeTabs}>
          {orderTypes.map(type =>
            type.key === activeOrderType ? (
              <PolygonButton
                key={type.key}
                text={type.label}
                width={90}
                height={25}
                color="#C2000E"
                textColor="#fff"
                textStyle={{ fontWeight: 'bold', fontSize: 16 }}
                style={{ marginHorizontal: 6 }}
              />
            ) : (
              <TouchableOpacity key={type.key} onPress={() => requestOrderTypeChange(type.key)}>
                <Text style={styles.orderTypeInactive}>{type.label}</Text>
              </TouchableOpacity>
            )
          )}
        </View>
        <Modal
          transparent
          visible={confirmOrderTypeModalVisible}
          animationType="fade"
          onRequestClose={cancelOrderTypeChange}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>

              <Text style={styles.modalTitle}>
                {`Switch to ${pendingOrderType ? getOrderTypeLabel(pendingOrderType) : 'this type'}?`}
              </Text>

              {/* Add AnimationImage here */}
              <Image
                source={require('../../../assets/elements/home/recharge_gift.png')}
                style={{ width: 120, height: 120, marginVertical: 12 }}
                resizeMode="contain"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={cancelOrderTypeChange}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnConfirm]}
                  onPress={confirmOrderTypeChange}
                >
                  <Text style={styles.modalBtnConfirmText}>Confirm</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>


        <View style={styles.rowContainer}>
          {activeOrderType !== "dinein" ? <TouchableOpacity
            style={styles.prominentTimeSelector}
            onPress={() => setShowDateTimePicker(true)}
          >

            <Text style={styles.prominentOutletText}>{selectedDateTime ? selectedDateTime : "Please Select Time"}</Text>
            {/* <Text style={styles.prominentOutletText}>{selectedDate}</Text> */}
            <FontAwesome6 name="clock" size={18} color="#C2000E" />
          </TouchableOpacity> : null}

          <TouchableOpacity
            style={[
              styles.prominentOutletSelector,
              activeOrderType === "dinein" && { width: '100%' }
            ]}
            onPress={() => router.push(activeOrderType === "delivery" ? { pathname: '/screens/home/address_select', params: { orderType: activeOrderType } } : { pathname: '/screens/home/outlet_select', params: { orderType: activeOrderType } })}
          >
            <View style={styles.outletBadge}>
              {activeOrderType === "delivery" ? <FontAwesome6 name="location-dot" size={14} color="#fff" /> : <FontAwesome6 name="store" size={14} color="#fff" />}
            </View>
            {activeOrderType === "delivery" ?
              selectedOutlet && selectedDeliveryAddress ? (<Text style={styles.prominentOutletText}>{(selectedDeliveryAddress.address?.length > 10 ? selectedDeliveryAddress.address.slice(0, 10) + '...' : selectedDeliveryAddress.address) ?? "Icon City"} | {selectedOutlet.distanceFromUserLocation ?? "0.00"}km</Text>) : null :
              selectedOutlet ? (<Text style={styles.prominentOutletText}>{(selectedOutlet.outletTitle?.length > 10 && activeOrderType === "pickup" ? selectedOutlet.outletTitle.slice(0, 10) + '...' : selectedOutlet.outletTitle) ?? "US Pizza Malaysia"} | {selectedOutlet.distanceFromUserLocation ?? "0.00"}km</Text>) : null}
            <FontAwesome6 name="chevron-right" size={14} color="#C2000E" />
          </TouchableOpacity>
        </View>

        <View style={[{ flex: 1, flexDirection: 'row', width: Math.min(width, 440), paddingBottom: totalPrice === 0 ? 80 : 0, alignSelf: 'center' }]}>
          {/* Category Sidebar */}
          <FlatList
            key={isWeb ? `category-list-${categories.length || 0}` : undefined}
            ref={categoryListRef}
            data={categoriesWithActive}
            keyExtractor={categoryKeyExtractor}
            extraData={listReady}
            getItemLayout={(data, index) => ({
              length: 90, // height of category item from your styles
              offset: 90 * index,
              index,
            })}
            onScrollToIndexFailed={(info) => {
              const wait = new Promise(resolve => setTimeout(resolve, 100));
              wait.then(() => {
                if (categoryListRef.current) {
                  categoryListRef.current.scrollToOffset({
                    offset: info.averageItemLength * info.index,
                    animated: true
                  });
                }
              });
            }}
            contentContainerStyle={styles.sidebar}
            showsVerticalScrollIndicator={false}
            renderItem={renderCategoryItem}
            {...categoryListPerfProps}
          />
          {/* Menu List */}
          <FlatList
            key={isWeb ? `menu-list-${menuItems.length || 0}` : undefined}
            ref={menuListRef}
            data={menuItems}
            // ⚠️ Optional: comment out getItemLayout if rows have variable heights
            // getItemLayout={(data, index) => ({ length: 152, offset: 152 * index, index })}
            keyExtractor={menuKeyExtractor}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
            viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs}
            renderItem={renderMenuItem}
            onContentSizeChange={() => {
              if (menuItems.length > 0 && !listReady) {
                setListReady(true);
              }
            }}
            // keep defaults for performance
            {...menuListPerfProps}
            onMomentumScrollEnd={() => {
              setTimeout(releaseCategoryLock, 1800);
            }}
            onScrollToIndexFailed={(info) => {
              // Smooth recovery when the target item hasn't been measured yet
              const offset = Math.max(0, info.averageItemLength * info.index - info.averageItemLength);
              menuListRef.current?.scrollToOffset({ offset, animated: false });
              setTimeout(() => {
                menuListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0,
                });
              }, 120);
            }}
          />


        </View>
        {/* Bottom Bar */}
        {totalPrice > 0 && (
          <View style={[styles.bottomBar, commonStyles.containerStyle]}>
            <PolygonButton
              text="Total"
              width={120}
              height={25}
              color="#C2000E"
              textColor="#fff"
              textStyle={{ fontWeight: 'bold', fontSize: 16 }}
            />
            <View style={styles.bottomPriceContainer}>
              <Text style={styles.bottomPriceSmall}>RM </Text>

              <Text style={styles.bottomPrice}>{totalPrice.toFixed(2)}</Text>
            </View>
            <PolygonButton
              text="Checkout"
              width={80}
              height={25}
              color="#C2000E"
              textColor="#fff"
              textStyle={{ fontSize: 14 }}
              onPress={handleCheckout}
            />
          </View>
        )}

        {selectedOutlet ? <CustomDateTimePickerModal
          showDateTimePicker={showDateTimePicker}
          setShowDateTimePicker={setShowDateTimePicker}
          setSelectedDateTime={setSelectedDateTime}
          outletId={selectedOutlet.outletId}
        /> : null}

      </SafeAreaView>
      {/* </View>
    </View> */}
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: Math.min(width, 440) * 0.25,
    backgroundColor: '#FCEEDB',
    paddingVertical: 0,
  },
  categoryDisabled: {
    opacity: 0.4,
  },
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4, // Add horizontal padding
    width: '100%',
    backgroundColor: '#FCEEDB',
    minHeight: 90, // Ensure consistent height
  },
  categoryItemActive: {
    backgroundColor: '#C2000E',
    width: '100%',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
    // tintColor: '#C2000E',
  },
  categoryLabel: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 13, // Slightly smaller font
    fontFamily: 'Route159-Bold',
    textAlign: 'center', // Center text
    paddingHorizontal: 4, // Add padding
    flexWrap: 'wrap', // Allow text wrapping
    width: '100%', // Take full width
  },
  categoryLabelActive: {
    color: '#fff',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
  },
  menuTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 28,
    fontFamily: 'Route159-HeavyItalic',
    letterSpacing: 1,
  },
  orderTypeTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 2,
  },
  orderTypeInactive: {
    color: '#B0B0B0',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
    marginHorizontal: 30,
  },
  promoBanner: {
    padding: 12,
    paddingBottom: 10,
    // ...(Platform.OS === 'web' && width > 440
    //   ? { width: '100%', maxWidth: 425 }
    //   : { width: '100%' }),
    width: Math.min(width, 440),
    alignSelf: "center",
  },
  promoImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  menuList: {
    width: Math.min(width, 440) * 0.75,
    backgroundColor: '#fff',
    padding: 5,
  },
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    width: '100%',
  },
  menuImage: {
    width: width <= 360 ? 110 : 120,
    height: 120,
    borderRadius: 12,
    margin: 8,
  },
  menuImageContainer: {
    position: 'relative',
  },
  notAvailableOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAvailableTextContainer: {
    transform: [{ rotate: '-45deg' }],
  },
  notAvailableText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Route159-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuInfo: {
    flex: 1,
    padding: 8,
    width: 50,
    justifyContent: 'center',
  },
  menuName: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 360 ? 16 : 18,
    fontFamily: 'Route159-Heavy',
    textAlign: 'right',
  },
  menuDesc: {
    color: '#888',
    fontSize: 10,
    marginVertical: 4,
    fontFamily: 'RobotoSlab-Regular',
    textAlign: 'right',
    width: '100%',
  },
  menuPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  menuOldPrice: {
    color: '#bbb',
    textDecorationLine: 'line-through',
    fontSize: width <= 390 ? 13 : 14,
    fontFamily: 'RobotoSlab-Regular',
  },
  menuPrice: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 390 ? (width <= 360 ? 16 : 17) : 18,
    fontFamily: 'Route159-Bold',
  },
  choiceBadge: {
    backgroundColor: '#C2000E',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  choiceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    fontFamily: 'Route159-Bold',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: width <= 440 ? (width <= 375 ? 6 : 8) : 10,
    justifyContent: 'space-between',
    paddingTop: width <= 440 ? (width <= 375 ? 14 : 10) : 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  bottomPrice: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 22,
    fontFamily: 'Route159-HeavyItalic',
  },
  bottomPriceSmall: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
  },
  bottomPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    width: Math.min(width, 440) * 0.4,
    paddingLeft: 15,
  },
  menuOldPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    width: '65%',
    padding: 3,
  },
  menuTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  menuTag: {
    width: 20,
    height: 20,
    marginLeft: 5
  },
  categoryDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingBottom: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginTop: 8,
    marginBottom: 2,
    paddingLeft: 12,
  },
  categoryDividerLineVertical: {
    width: 3,
    height: 16,
    backgroundColor: '#C2000E',
    marginRight: 8,
  },
  categoryDividerText: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-Bold',
  },
  prominentTimeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    // marginHorizontal: 16,
    marginRight: '2%',
    width: '38%',
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prominentTimeText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#C2000E',
    fontFamily: 'Route159-SemiBold',
  },
  rowContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
  },
  prominentOutletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    // marginHorizontal: 16,
    width: '60%',
    marginTop: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  outletBadge: {
    backgroundColor: '#C2000E',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  prominentOutletText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    fontFamily: 'Route159-SemiBold',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 280,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C2000E',
    marginBottom: 8,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontFamily: 'Route159-SemiBold',
    justifyContent: 'center',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnCancel: {
    backgroundColor: '#F0F0F0',
  },
  modalBtnConfirm: {
    backgroundColor: '#C2000E',
  },
  modalBtnCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalBtnConfirmText: {
    color: '#fff',
    fontWeight: '700',
  },
});
