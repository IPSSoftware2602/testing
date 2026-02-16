import { useRouter, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { useCallback, useRef, useState, useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions, FlatList, Image, Platform, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Modal } from 'react-native';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { apiUrl, imageUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LoginRequiredModal from '../../../components/ui/LoginRequiredModal';
import { FontAwesome, FontAwesome6 } from '@expo/vector-icons';
import CustomDateTimePickerModal from '../../../components/ui/CustomDateTimePickerModal';
// Removed useAuthGuard import - menu viewing now allowed without login (App Store requirement)
import MenuItem from '../../../components/menu/MenuItem';
import CategoryItem from '../../../components/menu/CategoryItem';
import { useToast } from '../../../hooks/useToast';

const { width } = Dimensions.get('window');

const orderTypes = [
  { key: 'dinein', label: 'Dine In' },
  { key: 'pickup', label: 'Pick Up' },
  { key: 'delivery', label: 'Delivery' },
];
const VALID_ORDER_TYPES = new Set(orderTypes.map((item) => item.key));

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
  // Removed useAuthGuard to allow menu viewing without login (App Store requirement)
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
  // Scroll position preservation
  const scrollOffsetRef = useRef(0);
  const shouldRestoreScrollRef = useRef(false);
  const pendingResetRef = useRef(false);
  //modal for confirm order type change
  const [confirmOrderTypeModalVisible, setConfirmOrderTypeModalVisible] = useState(false);
  const [pendingOrderType, setPendingOrderType] = useState(null);
  const { orderType, outletId, fromQR: fromQRParam } = useLocalSearchParams();
  const fromQR = String(fromQRParam) === '1';
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loadingCount, setLoadingCount] = useState(0);
  const navigation = useNavigation();
  const [uniqueQrData, setUniqueQrData] = useState(null);
  const [qrActiveOrderCount, setQrActiveOrderCount] = useState(0);

  const toast = useToast();
  const getResolvedOrderType = useCallback(async () => {
    if (orderType && VALID_ORDER_TYPES.has(String(orderType))) {
      return String(orderType);
    }
    if (activeOrderType && VALID_ORDER_TYPES.has(String(activeOrderType))) {
      return String(activeOrderType);
    }
    const storedOrderType = await AsyncStorage.getItem('orderType');
    if (storedOrderType && VALID_ORDER_TYPES.has(String(storedOrderType))) {
      return String(storedOrderType);
    }
    return 'delivery';
  }, [orderType, activeOrderType]);

  useEffect(() => {
    const checkShowDateTimePicker = async () => {
      const flag = await AsyncStorage.getItem('showDateTimePicker');
      if (
        flag === 'true' &&
        selectedOutlet?.outletId &&
        activeOrderType === 'dinein' &&
        selectedOutlet.isOperate === false
      ) {
        setShowDateTimePicker(true);
        await AsyncStorage.removeItem('showDateTimePicker');
      }
    };
    checkShowDateTimePicker();
  }, [selectedOutlet?.outletId, activeOrderType, selectedOutlet?.isOperate]);

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

  const fetchMenuData = useCallback(
    async ({ resetList = false } = {}) => {
      if (!selectedOutlet?.outletId) return;

      //check selected outlet is hq outlet
      if (selectedOutlet.isHQ === true) {
        router.push('/screens/home/outlet_select');
        return;
      }

      return runWithLoading(async () => {
        // Allow menu viewing without authentication
        try {
          const shouldResetList = resetList && !isWeb && !shouldRestoreScrollRef.current;
          if (shouldResetList) {
            categoryLockRef.current = false;
            isProgrammaticScroll.current = false;
            setCategoryLock(false);
            scrollOffsetRef.current = 0;
            pendingResetRef.current = true;
          }

          const token = await AsyncStorage.getItem('authToken');
          const customerJson = await AsyncStorage.getItem('customerData');
          const customerData = customerJson ? JSON.parse(customerJson) : null;
          const customerTier = fromQR ? 0 : (customerData ? customerData.customer_tier_id : 0);
          const headers = token ? { Authorization: `Bearer ${token}` } : {};
          const response = await axios.get(`${apiUrl}menu/all/${selectedOutlet.outletId}/${customerTier}`, { headers });

          const uniqueQrDataStr = await AsyncStorage.getItem('uniqueQrData');
          let allowedMenuItemIds = null;
          if (fromQR && uniqueQrDataStr) {
            try {
              const uniqueQrData = JSON.parse(uniqueQrDataStr);
              // Check if menu_item_ids exists and is an array with length > 0
              // User said: "If no items selected ... show ALL items (default behavior)" -> confirmed "Yes correct".
              // So we only filter if we have specific IDs.
              if (uniqueQrData.menu_item_ids && Array.isArray(uniqueQrData.menu_item_ids) && uniqueQrData.menu_item_ids.length > 0) {
                allowedMenuItemIds = uniqueQrData.menu_item_ids.map(String);
              }
            } catch (e) { }
          }

          const fetchedItems = (response.data.Items || [])
            .filter(item => {
              if (allowedMenuItemIds) {
                return allowedMenuItemIds.includes(String(item.id));
              }
              return true;
            })
            .map(item => {
              const rawImageUrl = item.images && item.images.length > 0 ? item.images[0].image_url : null;
              const imageUrlFull = rawImageUrl
                ? (String(rawImageUrl).startsWith('http')
                  ? String(rawImageUrl)
                  : imageUrl + 'menu_images/' + String(rawImageUrl))
                : null;

              const mappedTags = (item.tags || []).map(tag => ({
                id: tag.id,
                title: tag.title,
                icon: tag.icon_url
                  ? { uri: String(tag.icon_url).startsWith('http') ? String(tag.icon_url) : imageUrl + 'tags/' + String(tag.icon_url) }
                  : require('../../../assets/icons/burger.png'),
              }));

              return {
                id: item.id,
                name: item.title,
                description: item.short_description,
                price: item.price,
                discount_price: fromQR ? 0 : item.discount_price,
                image: imageUrlFull,
                categoryIds: (item.category_ids || []).map(id => String(id)),
                tags: mappedTags,
                is_available: item.is_available,
                membership_tier: item.membership_tier,
              };
            });
          setMenuItems(fetchedItems);
          setListReady(fetchedItems.length > 0);

          // Update Categories to only show those having items
          const activeCategoryIds = new Set();
          fetchedItems.forEach(item => {
            if (item.categoryIds) {
              item.categoryIds.forEach(cid => activeCategoryIds.add(String(cid)));
            }
          });

          const filteredCategories = (response.data.Categories || [])
            .filter(cat => activeCategoryIds.has(String(cat.id)))
            .map(cat => ({
              key: String(cat.id),
              label: cat.title,
              icon: cat.image_url
                ? { uri: imageUrl + "menu_categories/" + String(cat.image_url) }
                : require('../../../assets/icons/burger.png'),
            }));
          setCategories(filteredCategories);

          if (filteredCategories.length > 0) {
            setActiveCategory(prev => {
              const prevKey = prev != null ? String(prev) : '';
              if (prevKey && filteredCategories.some(cat => cat.key === prevKey)) {
                return prevKey;
              }
              return filteredCategories[0].key;
            });
          } else {
            setActiveCategory('');
          }
        } catch (_err) {
          setListReady(menuItemsRef.current.length > 0);
        }
      });
    },
    [selectedOutlet?.outletId, runWithLoading, fromQR]
  );

  useEffect(() => {
    const handleQR = async () => {
      if (!fromQR || !orderType || !outletId) return;

      await runWithLoading(async () => {
        // await checkoutClearStorage();
        // QR entry resets order-flow storage and rehydrates outlet from QR params.
        await checkoutClearStorage({ preserveDeliveryAddress: true });

        await AsyncStorage.setItem("orderType", String(orderType));
        setActiveOrderType(String(orderType));

        try {
          const token = await AsyncStorage.getItem("authToken");
          const res = await axios.get(`${apiUrl}outlets/${outletId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const outlet = res.data?.result || res.data?.data || res.data;

          if (!outlet?.id) {
            return;
          }

          const outletObj = {
            outletId: String(outlet.id),
            outletTitle: outlet.title,
            distanceFromUserLocation: outlet.distance_km ?? "0.00",
            isOperate: outlet.operating_schedule
              ? outlet.operating_schedule[new Date().toLocaleString("en-US", { weekday: "long" })]?.is_operated ?? true
              : true,
            operatingHours: outlet.operating_schedule ?? {},
            lead_time: outlet.lead_time,
            delivery_start: outlet.delivery_start,
            delivery_end: outlet.delivery_end,
            delivery_interval: outlet.delivery_interval,
            delivery_available_days: outlet.delivery_available_days,
            delivery_settings: outlet.delivery_settings || [],
          };

          await AsyncStorage.setItem("outletDetails", JSON.stringify(outletObj));
          setSelectedOutlet(outletObj);

          setTimeout(() => {
            fetchMenuData({ resetList: true });
          }, 200);

          if (orderType === "dinein" && outletObj.isOperate === false) {
            setShowDateTimePicker(true);
          }

        } catch (_err) {
        }
      });

      // Auto-show date picker for QR orders (only if no valid time selected yet)
      if (fromQR) {
        setTimeout(async () => {
          try {
            const estimatedTimeStr = await AsyncStorage.getItem('estimatedTime');
            if (estimatedTimeStr) {
              const parsedEstimatedTime = JSON.parse(estimatedTimeStr);
              // If ASAP or has a valid future time, don't show picker
              if (parsedEstimatedTime?.estimatedTime === 'ASAP') return;
              if (parsedEstimatedTime?.date && parsedEstimatedTime?.time) {
                const [y, m, d] = parsedEstimatedTime.date.split('-').map(Number);
                const timeParts = parsedEstimatedTime.time.split(':').map(Number);
                const selectedDate = new Date(y, m - 1, d, timeParts[0], timeParts[1], timeParts[2] || 0);
                // If selectedDate is still in the future, no need to show picker
                if (selectedDate > new Date()) return;
              }
            }
            // No valid time selected — show picker
            setShowDateTimePicker(true);
          } catch (_err) {
            setShowDateTimePicker(true);
          }
        }, 500);
      }
    };

    const fetchUniqueQrData = async () => {
      try {
        const data = await AsyncStorage.getItem('uniqueQrData');
        if (data) {
          setUniqueQrData(JSON.parse(data));
        }
      } catch (e) {
        console.error('Error fetching unique QR data', e);
      }
    };

    if (fromQR) {
      fetchUniqueQrData();
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: "none" },
      });
    } else {
      navigation.getParent()?.setOptions({
        tabBarStyle: { display: "flex" },
      });
    }

    handleQR();
  }, [orderType, outletId, fetchMenuData, runWithLoading, fromQR, navigation]);

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
    catch (_err) {
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
    catch (_err) {
    }
  }

  useEffect(() => {
    const parseLocalDateTime = (dateStr, timeStr) => {
      if (!dateStr || !timeStr) return null;

      // Expecting: dateStr = "YYYY-MM-DD", timeStr = "HH:mm" or "HH:mm:ss"
      const [y, m, d] = dateStr.split("-").map(Number);
      const timeParts = timeStr.split(":").map(Number);

      if (!y || !m || !d || timeParts.length < 2) return null;

      const hh = timeParts[0];
      const mm = timeParts[1];
      const ss = timeParts[2] ?? 0;

      // Create local time date (month is 0-based)
      const dt = new Date(y, m - 1, d, hh, mm, ss);

      // Guard invalid date
      if (isNaN(dt.getTime())) return null;

      return dt;
    };

    const fetchOutletData = async () => {
      try {
        if (fromQR) return;
        const storedOrderType = await AsyncStorage.getItem('orderType');
        const resolvedOrderType = (storedOrderType && VALID_ORDER_TYPES.has(storedOrderType))
          ? storedOrderType
          : 'delivery';
        setActiveOrderType(resolvedOrderType);
        const [outletDetailsStr, estimatedTimeStr, deliveryAddressDetails] = await Promise.all([
          AsyncStorage.getItem("outletDetails"),
          AsyncStorage.getItem("estimatedTime"),
          AsyncStorage.getItem("deliveryAddressDetails"),
        ]);

        if (!outletDetailsStr) {
          router.push("/screens/home/outlet_select");
          return;
        }

        const parsedOutletDetails = JSON.parse(outletDetailsStr);
        setSelectedOutlet(parsedOutletDetails);

        const parsedEstimatedTime = estimatedTimeStr ? JSON.parse(estimatedTimeStr) : null;

        // 1) Over-time check (only for scheduled, not ASAP)
        let is_over = false;
        if (parsedEstimatedTime?.estimatedTime && parsedEstimatedTime.estimatedTime !== "ASAP") {
          const estimatedAt = parseLocalDateTime(parsedEstimatedTime.date, parsedEstimatedTime.time);
          if (estimatedAt) is_over = new Date() >= estimatedAt;
        }

        // 2) Lead time validation — default to valid; only invalidate if lead_time
        //    is known AND the selected time is too early.
        let is_lead_time_valid = true;
        if (
          resolvedOrderType === "delivery" &&
          deliveryAddressDetails &&
          parsedEstimatedTime?.estimatedTime &&
          parsedEstimatedTime.estimatedTime !== "ASAP"
        ) {
          const selectedDate = parseLocalDateTime(parsedEstimatedTime?.date, parsedEstimatedTime?.time);
          if (selectedDate) {
            // Use minimum lead_time from delivery_settings if available, else flat field
            let leadMinutes = 0;
            if (parsedOutletDetails.delivery_settings && Array.isArray(parsedOutletDetails.delivery_settings) && parsedOutletDetails.delivery_settings.length > 0) {
              const selectedDay = selectedDate.getDay();
              const matchingSettings = parsedOutletDetails.delivery_settings.filter(s => {
                const days = (s.delivery_available_days || '').split(',').map(d => parseInt(d.trim())).filter(n => !isNaN(n));
                return days.includes(selectedDay);
              });
              if (matchingSettings.length > 0) {
                leadMinutes = Math.min(...matchingSettings.map(s => Number(s.lead_time) || 0));
              }
            } else if (parsedOutletDetails.lead_time) {
              leadMinutes = Number(parsedOutletDetails.lead_time) || 0;
            }

            if (leadMinutes > 0) {
              const minTime = new Date(Date.now() + leadMinutes * 60000);
              is_lead_time_valid = selectedDate >= minTime;
            }
          }
        }
        // 3) Show picker logic
        const noEstimatedTime = !estimatedTimeStr;

        const shouldShow =
          (resolvedOrderType === "delivery" && (noEstimatedTime || !is_lead_time_valid)) ||
          (resolvedOrderType !== "dinein" && resolvedOrderType !== "delivery" && noEstimatedTime) ||
          (is_over && resolvedOrderType !== "dinein");
        if (shouldShow) setShowDateTimePicker(true);
      } catch (err) {
        console.warn("fetchOutletData error:", err);
      }
    };

    fetchOutletData();

    const fetchEstimatedTime = async () => {
      try {
        const estimatedTime = await AsyncStorage.getItem('estimatedTime');
        if (estimatedTime) {
          const parsedEstimatedTime = JSON.parse(estimatedTime);

          setSelectedDateTime(parsedEstimatedTime.estimatedTime);
          // setEstimatedtime(parsedOutletDetails);
        }
      } catch (_err) {
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
        else if (!deliveryAddressDetails && activeOrderType === "delivery" && !fromQR) {
          // Double check if it's really not a QR order from text param
          // But 'fromQR' is derived from useLocalSearchParams orderType & outletId existence
          router.push('/screens/home/address_select');
        }
      } catch (_err) {
      }
    }
    fetchAddressData();

  }, [router, activeOrderType, fromQR])

  useEffect(() => {
    const fetchOrderType = async () => {
      try {
        const resolvedOrderType = await getResolvedOrderType();
        setActiveOrderType(resolvedOrderType);
      } catch (_err) {
      }
    };
    fetchOrderType();
  }, [getResolvedOrderType]);

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

  useEffect(() => {
    if (listReady && pendingResetRef.current) {
      pendingResetRef.current = false;
      requestAnimationFrame(() => {
        categoryListRef.current?.scrollToOffset({ offset: 0, animated: false });
        menuListRef.current?.scrollToOffset({ offset: 0, animated: false });
        scrollOffsetRef.current = 0;
      });
    }
  }, [listReady, menuItems.length, categories.length]);

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

  // Track scroll position
  const handleScroll = useCallback((event) => {
    scrollOffsetRef.current = event.nativeEvent.contentOffset.y;
  }, []);

  // Memoized callback functions to prevent recreation on every render
  const handleItemPress = useCallback((itemId) => {
    router.push({
      pathname: '/screens/menu/menu_item',
      params: {
        id: itemId,
        source: 'menu',
        outletId: selectedOutlet?.outletId, // Pass context
        orderType: activeOrderType, // Pass context
        fromQR: fromQR ? '1' : '0',
      },
    });
  }, [router, selectedOutlet, activeOrderType, fromQR]);

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
      } catch (_err) {
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
      } catch (_err) {
        const roughOffset = Math.max(0, index * APPROX_ITEM_HEIGHT - APPROX_ITEM_HEIGHT);
        menuListRef.current.scrollToOffset({ offset: roughOffset, animated: false });

        setTimeout(() => {
          try {
            menuListRef.current.scrollToIndex({
              index,
              animated: true,
              viewPosition: 0,
            });
          } catch (_innerErr) {
          } finally {
            setTimeout(releaseCategoryLock, LOCK_RELEASE_MS);
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
      onPress={listReady ? handleCategoryPressCallback : undefined} // Disable taps if the list is not ready
      disabled={!listReady}
      style={[
        styles.categoryItem,
        item.isActive && styles.categoryItemActive, // Apply active style
      ]}
      iconStyle={{
        tintColor: item.isActive ? '#FFFFFF' : '#C2000E', // White when active, red otherwise
      }}
    />
  ), [listReady, handleCategoryPressCallback]);

  const renderMenuItem = useCallback(({ item, index }) => {
    const isFirst = isFirstInCategory(menuItems, index, item.categoryIds?.[0]);
    return (
      <MenuItem
        item={item}
        index={index}
        isFirstInCategory={isFirst}
        categories={categories}
        customer={customer}
        onPress={handleItemPress}
        isQrOrder={fromQR}
      />
    );
  }, [menuItems, categories, customer, handleItemPress, isFirstInCategory, fromQR]);

  useEffect(() => {
    // Release the lock after a short delay to allow animations to complete
    if (categoryLock) {
      const timer = setTimeout(() => setCategoryLock(false), 800);
      return () => clearTimeout(timer);
    }
  }, [categoryLock]);

  const checkoutClearStorage = async ({ preserveDeliveryAddress = false } = {}) => {
    const keysToRemove = [
      'estimatedTime',
      'deliveryAddressDetails',
      'orderType',
      'outletDetails',
      'paymentMethod'
    ];
    const finalKeysToRemove = preserveDeliveryAddress
      ? keysToRemove.filter((key) => key !== 'deliveryAddressDetails')
      : keysToRemove;

    try {
      await AsyncStorage.multiRemove(finalKeysToRemove);

      const clearedStorage = await AsyncStorage.multiGet(finalKeysToRemove);
      const wereCleared = clearedStorage.every(([_, value]) => value === null);

      if (!wereCleared) {
        throw new Error('Storage clearance failed');
      }

      return true;
    } catch (_err) {
      return false;
    }
  };

  useFocusEffect(
    useCallback(() => {
      const needsRestore = shouldRestoreScrollRef.current && scrollOffsetRef.current > 0;

      if (isWeb) {
        fetchMenuData({ resetList: false });
      } else {
        // Don't reset list if we need to restore scroll position
        fetchMenuData({ resetList: !needsRestore });
      }

      // Restore scroll position if we're returning from a detail page
      if (needsRestore) {
        // Mark that we're restoring (so fetchMenuData won't reset scroll)
        const savedOffset = scrollOffsetRef.current;
        shouldRestoreScrollRef.current = false; // Clear flag immediately to prevent multiple restorations

        // Wait for list to be ready before restoring scroll
        const restoreScroll = () => {
          if (menuListRef.current && listReady && savedOffset > 0) {
            isProgrammaticScroll.current = true;
            requestAnimationFrame(() => {
              menuListRef.current?.scrollToOffset({
                offset: savedOffset,
                animated: false,
              });
              scrollOffsetRef.current = savedOffset;
              // Release the programmatic scroll flag after a short delay
              setTimeout(() => {
                isProgrammaticScroll.current = false;
              }, 200);
            });
          } else if (menuListRef.current && !listReady) {
            // If list not ready yet, try again after a short delay
            setTimeout(restoreScroll, 150);
          }
        };

        // Small delay to ensure list is rendered and data is loaded
        const timer = setTimeout(restoreScroll, 150);

        return () => {
          clearTimeout(timer);
        };
      }
    }, [fetchMenuData, listReady])
  );

  useEffect(() => {
    if (selectedOutlet?.outletId) {
      // Reset scroll position when outlet changes (not when returning from detail page)
      if (!shouldRestoreScrollRef.current) {
        scrollOffsetRef.current = 0;
      }
      fetchMenuData({ resetList: !isWeb });
    }
  }, [selectedOutlet?.outletId, fetchMenuData]);

  function limitDecimals(value, maxDecimals = 7) {
    if (!value) return "";
    const num = parseFloat(value);
    return Math.floor(num * Math.pow(10, maxDecimals)) / Math.pow(10, maxDecimals);
  }

  const formatDateTime = useCallback(() => {
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
        // const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

        finalDate = selectedDate.toISOString().split("T")[0];
        finalTime = `${String(selectedDate.getHours()).padStart(2, "0")}:${String(selectedDate.getMinutes()).padStart(2, "0")}`;
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

      if (!token || !customer?.id) {
        return 0;
      }

      if (!selectedOutlet?.outletId) {
        return 0;
      }

      return await runWithLoading(async () => {
        const resolvedOrderType = await getResolvedOrderType();
        const estimatedTimeObj = formatDateTime();
        const response = await axios.get(`${apiUrl}cart/get`, {
          params: {
            customer_id: customer.id,
            outlet_id: selectedOutlet.outletId,
            address: selectedDeliveryAddress ? selectedDeliveryAddress.address : "",
            order_type: resolvedOrderType,
            latitude: selectedDeliveryAddress ? limitDecimals(selectedDeliveryAddress.latitude) : "",
            longitude: selectedDeliveryAddress ? limitDecimals(selectedDeliveryAddress.longitude) : "",
            selected_date: estimatedTimeObj && estimatedTimeObj.estimatedTime === "ASAP" ? null : estimatedTimeObj?.date,
            selected_time: estimatedTimeObj && estimatedTimeObj.estimatedTime === "ASAP" ? null : estimatedTimeObj?.time,
          },
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response.data?.status === 200 && response.data?.data?.order_summary) {
          return parseFloat(response.data.data.order_summary.subtotal_amount) || 0;
        }
        return 0;
      });
    } catch (error) {
      if (error?.response?.status === 400) {
        toast.show(error?.response?.data?.message, {
          type: 'custom_toast',
          data: { title: 'Error', status: 'danger' }
        });
        const resolvedOrderType = await getResolvedOrderType();
        if (resolvedOrderType === "delivery" || resolvedOrderType === "pickup") {
          setShowDateTimePicker(true);
        }
        if (error?.response?.data?.message?.includes("Cart is empty")) {
          return 0;
        }

        if (error?.response?.data?.status === 405) {
          router.push({ pathname: '(tabs)', params: { setErrorModal: true } });
          checkoutClearStorage();
        }
      }

    }
    return 0;
  }, [selectedOutlet, selectedDeliveryAddress, router, formatDateTime, runWithLoading, getResolvedOrderType]);

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

  const handleCheckout = async () => {
    // Check if user is logged in - required for checkout (order placement)
    const authToken = await AsyncStorage.getItem('authToken');
    const customerData = await AsyncStorage.getItem('customerData');

    if (!authToken || !customerData) {
      setShowLoginModal(true);
      return;
    }

    formatDateTime();
    router.push('/screens/orders/checkout');
  };

  const handleLoginModalConfirm = () => {
    setShowLoginModal(false);
    router.push('/screens/auth/login');
  };

  const handleOpenQrOrders = useCallback(() => {
    if (!fromQR) return;
    router.push({
      pathname: '/screens/orders/qr_orders',
      params: {
        outletId: selectedOutlet?.outletId || outletId,
        orderType: activeOrderType || orderType || 'delivery',
        fromQR: '1',
      },
    });
  }, [fromQR, router, selectedOutlet?.outletId, outletId, activeOrderType, orderType]);

  const fetchQrActiveOrderCount = useCallback(async () => {
    if (!fromQR) {
      setQrActiveOrderCount(0);
      return;
    }

    try {
      const [token, customerJson, uniqueQrDataStr] = await Promise.all([
        AsyncStorage.getItem('authToken'),
        AsyncStorage.getItem('customerData'),
        AsyncStorage.getItem('uniqueQrData'),
      ]);

      const customerData = customerJson ? JSON.parse(customerJson) : null;
      const qrData = uniqueQrDataStr ? JSON.parse(uniqueQrDataStr) : null;
      const uniqueQrCode = qrData?.unique_code || '';

      if (!token || !customerData?.id || !uniqueQrCode) {
        setQrActiveOrderCount(0);
        return;
      }

      const startDate = customerData?.created_at ? customerData.created_at.split(' ')[0] : '2020-01-01';
      const today = new Date().toISOString().split('T')[0];

      const response = await axios.get(
        `${apiUrl}customer-order-list/${customerData.id}?start_date=${startDate}&end_date=${today}&status=pending&unique_qr_code=${encodeURIComponent(uniqueQrCode)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const activeOrders = response?.data?.data || [];
      setQrActiveOrderCount(activeOrders.length);
    } catch (_err) {
      setQrActiveOrderCount(0);
    }
  }, [fromQR]);

  useFocusEffect(
    useCallback(() => {
      fetchQrActiveOrderCount();
      return undefined;
    }, [fetchQrActiveOrderCount])
  );
  console.log(totalPrice);

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
        <TopNavigation
          title="MENU"
          isBackButton={false}
          rightElement={
            fromQR ? (
              <TouchableOpacity onPress={handleOpenQrOrders} accessibilityLabel="Open QR Orders">
                <View style={styles.qrOrderIconWrapper}>
                  <FontAwesome name="list-alt" size={22} color="#C2000E" />
                  {qrActiveOrderCount > 0 ? (
                    <View style={styles.qrOrderBadge}>
                      <Text style={styles.qrOrderBadgeText}>
                        {qrActiveOrderCount > 99 ? '99+' : String(qrActiveOrderCount)}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </TouchableOpacity>
            ) : null
          }
        />

        {/* Order Type Tabs */}
        {!fromQR && (
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
        )}
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
              fromQR && activeOrderType === "delivery" && styles.prominentOutletSelectorDisabled,
              activeOrderType === "dinein" && { width: '100%' }
            ]}
            disabled={fromQR && activeOrderType === "delivery"}
            onPress={() => {
              try {
                if (activeOrderType === "delivery") {
                  router.push('/screens/home/address_select');
                } else {
                  router.push('/screens/home/outlet_select');
                }
              } catch (e) {
                toast.show(e.message);
              }
            }}
          >
            <View style={styles.outletBadge}>
              {activeOrderType === "delivery" ? <FontAwesome6 name="location-dot" size={14} color="#fff" /> : <FontAwesome6 name="store" size={14} color="#fff" />}
            </View>
            {activeOrderType === "delivery" ?
              selectedOutlet && selectedDeliveryAddress ? (<Text style={styles.prominentOutletText}>{(selectedDeliveryAddress.address?.length > 10 ? selectedDeliveryAddress.address.slice(0, 10) + '...' : selectedDeliveryAddress.address) ?? "Icon City"} | {selectedOutlet.distanceFromUserLocation ?? "0.00"}km</Text>) : null :
              selectedOutlet ? (<Text style={styles.prominentOutletText}>{(selectedOutlet.outletTitle?.length > 10 && activeOrderType === "pickup" ? selectedOutlet.outletTitle.slice(0, 10) + '...' : selectedOutlet.outletTitle) ?? "US Pizza Malaysia"} | {selectedOutlet.distanceFromUserLocation ?? "0.00"}km</Text>) : null}
            {!(fromQR && activeOrderType === "delivery") && (
              <FontAwesome6 name="chevron-right" size={14} color="#C2000E" />
            )}
          </TouchableOpacity>
        </View>

        <View style={[{ flex: 1, flexDirection: 'row', width: Math.min(width, 440), paddingBottom: totalPrice === 0 && !fromQR ? 80 : 0, alignSelf: 'center' }]}>
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
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
          <View style={[styles.bottomBar, commonStyles.containerStyle, fromQR && { marginBottom: 10, paddingBottom: 0, borderBottomWidth: 0 }]}>
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

        {/* Custom Footer for Unique QR */}
        {fromQR && uniqueQrData && (
          <View style={[styles.bottomBar, commonStyles.containerStyle, { justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 20 }]}>
            <Image
              source={require('../../../assets/images/uspizza-icon.png')}
              style={{ width: 60, height: 60, resizeMode: 'contain' }}
            />
            <View style={styles.qrFooterInfo}>
              <Text style={styles.qrFooterName} numberOfLines={1}>
                {uniqueQrData.name || 'QR Order'}
              </Text>
              <Text style={styles.qrFooterAddress} numberOfLines={2}>
                {selectedDeliveryAddress?.address || uniqueQrData?.address || 'QR Delivery Address'}
              </Text>
            </View>
            {uniqueQrData.logo ? (
              <Image
                source={{ uri: uniqueQrData.logo.startsWith('http') ? uniqueQrData.logo : imageUrl + 'unique_qr/' + uniqueQrData.logo }}
                style={{ width: 60, height: 60, resizeMode: 'contain' }}
              />
            ) : null}
          </View>
        )}

        {selectedOutlet ? <CustomDateTimePickerModal
          showDateTimePicker={showDateTimePicker}
          setShowDateTimePicker={setShowDateTimePicker}
          setSelectedDateTime={setSelectedDateTime}
          outletId={selectedOutlet.outletId}
        /> : null}

        {isLoading ? (
          <View style={styles.loadingOverlay} pointerEvents="auto">
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color="#C2000E" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          </View>
        ) : null}

        <LoginRequiredModal
          isVisible={showLoginModal}
          onConfirm={handleLoginModalConfirm}
          onCancel={() => setShowLoginModal(false)}
        />

      </SafeAreaView>
      {/* </View>
    </View> */}
    </ResponsiveBackground >
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
    tintColor: '#C2000E',
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
  qrOrderIconWrapper: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrOrderBadge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: '#C2000E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  qrOrderBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Route159-Bold',
    lineHeight: 11,
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
  prominentOutletSelectorDisabled: {
    opacity: 0.8,
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
  qrFooterInfo: {
    flex: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  qrFooterName: {
    color: '#C2000E',
    fontSize: 14,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
    marginBottom: 2,
  },
  qrFooterAddress: {
    color: '#333',
    fontSize: 11,
    fontFamily: 'RobotoSlab-Regular',
    textAlign: 'center',
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
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
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
