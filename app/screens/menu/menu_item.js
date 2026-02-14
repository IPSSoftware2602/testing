import { AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList, ActivityIndicator, Platform } from 'react-native';
import { Image } from 'expo-image';
import { createShimmerPlaceholder } from 'react-native-shimmer-placeholder';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import PolygonButton from '../../../components/ui/PolygonButton';
import TopNavigation from '../../../components/ui/TopNavigation';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { apiUrl, imageUrl } from '../../constant/constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
// // import { useToast } from 'react-native-toast-notifications';
// import { useToast } from '../../../hooks/useToast';
import { useToast } from '../../../hooks/useToast';
import LoginRequiredModal from '../../../components/ui/LoginRequiredModal';
import PropTypes from 'prop-types';
// Removed useAuthGuard import - menu item viewing accessible without login (App Store requirement)

const ShimmerPlaceHolder = createShimmerPlaceholder(LinearGradient);

const { width } = Dimensions.get('window');
const OPTIONS_VIRTUALIZATION_THRESHOLD = Platform.OS === 'web' ? 1000 : 12; // Use FlatList when options > 12 (disable on web)

const OptionCard = React.memo(({
  item,
  parents,
  type = 'option',
  onOptionToggle,
  group,
  selected,
  selectedCount,
  maxQ,
  minQ,
  toast,
  isQrOrder = false,
}) => {
  const [imageLoading, setImageLoading] = useState(true);

  const imageSource = useMemo(() => {
    if (!item.image) {
      return require('../../../assets/images/menu_default.jpg');
    }
    // Image is already a full URL from the data preparation
    return { uri: item.image, cachePolicy: 'memory-disk' };
  }, [item.image]);

  const handlePress = useCallback(() => {
    onOptionToggle(item.id, item.price, selected, selectedCount, maxQ, minQ, group);
  }, [item.id, item.price, selected, selectedCount, maxQ, minQ, group, onOptionToggle]);

  const imageStyle = useMemo(() =>
    type === 'variation'
      ? {
        width: '100%',
        height: 80,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }
      : styles.optionImageLeft,
    [type]
  );

  const priceText = useMemo(() =>
    item.price > 0 ? `+RM ${item.price.toFixed(2)}` : `RM ${item.price.toFixed(2)}`,
    [item.price]
  );

  const discountPriceText = useMemo(() =>
    !isQrOrder && item.discount_price > 0 ? `-RM ${item.discount_price.toFixed(2)}` : null,
    [item.discount_price, isQrOrder]
  );

  const imageContainerStyle = useMemo(() =>
    type === 'variation'
      ? {
        width: '100%',
        height: 80,
        position: 'relative',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        overflow: 'hidden',
      }
      : {
        ...styles.optionImageLeft,
        position: 'relative',
        overflow: 'hidden',
      },
    [type]
  );

  const shimmerStyle = useMemo(() =>
    type === 'variation'
      ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: 80,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
      }
      : {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: 60,
        height: 70,
        borderBottomLeftRadius: 8,
        borderTopLeftRadius: 8,
      },
    [type]
  );

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[
        styles.commonCard,
        type === 'option' && styles.optionCardExtra,
        { borderColor: selected ? '#C2000E' : '#eee' }
      ]}
    >
      <View style={imageContainerStyle}>
        <Image
          source={imageSource}
          style={imageStyle}
          contentFit="cover"
          transition={100}
          cachePolicy="memory-disk"
          recyclingKey={String(item.id)}
          priority={selected ? "high" : "low"}
          placeholder={require('../../../assets/images/menu_default.jpg')}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={() => setImageLoading(false)}
        />
        {imageLoading && (
          <ShimmerPlaceHolder
            style={shimmerStyle}
            shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
            autoRun={true}
            duration={1500}
          />
        )}
      </View>
      <View style={styles.optionDetails}>
        <Text style={styles.optionName}>{item.name}</Text>
        <View style={styles.optionRow}>
          <Text style={styles.optionPrice}>{priceText}</Text>
          {discountPriceText && (
            <Text style={styles.optionDiscountPrice}>{discountPriceText}</Text>
          )}
          <TouchableOpacity
            onPress={handlePress}
            activeOpacity={0.8}
            style={[styles.addButton, selected && { backgroundColor: '#C2000E' }]}
            disabled={!selected && selectedCount >= maxQ}
          >
            <AntDesign name={selected ? 'check' : 'plus'} size={12} color={selected ? '#fff' : '#C2000E'} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for better memoization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.name === nextProps.item.name &&
    prevProps.item.price === nextProps.item.price &&
    prevProps.item.discount_price === nextProps.item.discount_price &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.selected === nextProps.selected &&
    prevProps.selectedCount === nextProps.selectedCount &&
    prevProps.maxQ === nextProps.maxQ &&
    prevProps.minQ === nextProps.minQ &&
    prevProps.parents === nextProps.parents &&
    prevProps.type === nextProps.type &&
    prevProps.isQrOrder === nextProps.isQrOrder
  );
});

OptionCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    discount_price: PropTypes.number,
    image: PropTypes.string,
    tags: PropTypes.array
  }).isRequired,
  parents: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['option', 'variation']),
  onOptionToggle: PropTypes.func.isRequired,
  group: PropTypes.object,
  selected: PropTypes.bool.isRequired,
  selectedCount: PropTypes.number.isRequired,
  maxQ: PropTypes.number.isRequired,
  minQ: PropTypes.number.isRequired,
  toast: PropTypes.object.isRequired,
  isQrOrder: PropTypes.bool,
};

OptionCard.defaultProps = {
  type: 'option',
  group: null
};
OptionCard.displayName = 'OptionCard';

// Optimized Option Group Component with FlatList support
const OptionGroup = React.memo(({
  group,
  selectedOptions,
  handleOptionToggle,
  toast,
  isQrOrder = false,
}) => {
  // Pre-compute selected states and counts for all options in this group
  const optionData = useMemo(() => {
    const selectedOptionGroup = selectedOptions.find(opt => opt.parents === group.id);
    const selectedIds = new Set(selectedOptionGroup?.options || []);
    const selectedCount = selectedIds.size;
    const minQ = Number(group?.min_quantity || 0);
    const rawMaxQ = Number(group?.max_quantity || 0);
    const maxQ = (minQ === 0 && rawMaxQ === 0) ? Infinity : (rawMaxQ || 99);

    return (group.options || []).map(opt => {
      let imageUri = '';
      if (opt.images_compressed || opt.images) {
        const imgPath = opt.images_compressed || opt.images;
        imageUri = imgPath.startsWith('http')
          ? imgPath
          : `${imageUrl}menu_options/${imgPath}`;
      }
      return {
        id: opt.id,
        name: opt.title,
        price: Number(opt.price_adjustment ?? opt.price ?? 0),
        discount_price: isQrOrder ? 0 : Number(opt.discount_price || 0),
        image: imageUri,
        selected: selectedIds.has(opt.id),
        selectedCount,
        maxQ,
        minQ,
      };
    });
  }, [group, selectedOptions, isQrOrder]);

  const minQ = Number(group?.min_quantity || 0);
  const rawMaxQ = Number(group?.max_quantity || 0);
  const maxQ = (minQ === 0 && rawMaxQ === 0) ? Infinity : (rawMaxQ || 99);
  const selectedOptionGroup = selectedOptions.find(opt => opt.parents === group.id);
  const selectedCount = selectedOptionGroup?.options?.length || 0;

  // Use FlatList for large option lists, regular map for small ones
  const shouldUseFlatList = optionData.length > OPTIONS_VIRTUALIZATION_THRESHOLD;

  const renderOption = useCallback(({ item: optData }) => (
    <OptionCard
      item={optData}
      parents={group.id}
      type="option"
      onOptionToggle={handleOptionToggle}
      group={group}
      selected={optData.selected}
      selectedCount={selectedCount}
      maxQ={maxQ}
      minQ={minQ}
      toast={toast}
      isQrOrder={isQrOrder}
    />
  ), [group, selectedCount, maxQ, minQ, handleOptionToggle, toast, isQrOrder]);

  const renderOptionItem = useCallback((optData, index) => (
    <OptionCard
      key={optData.id}
      item={optData}
      parents={group.id}
      type="option"
      onOptionToggle={handleOptionToggle}
      group={group}
      selected={optData.selected}
      selectedCount={selectedCount}
      maxQ={maxQ}
      minQ={minQ}
      toast={toast}
      isQrOrder={isQrOrder}
    />
  ), [group, selectedCount, maxQ, minQ, handleOptionToggle, toast, isQrOrder]);

  const keyExtractor = useCallback((item) => String(item.id), []);

  return (
    <View style={styles.optionsSection}>
      <Text style={styles.sectionTitle}>
        {group.title}
        {String(group.is_required) === "1" ? <Text style={{ color: '#C2000E' }}> *</Text> : null}
      </Text>
      {optionData.length > 0 ? (
        shouldUseFlatList ? (
          <FlatList
            data={optionData}
            renderItem={renderOption}
            keyExtractor={keyExtractor}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.optionsGrid}
            removeClippedSubviews={true}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            windowSize={3}
            updateCellsBatchingPeriod={50}
          />
        ) : (
          <View style={styles.optionsGrid}>
            {optionData.map(optData => renderOptionItem(optData))}
          </View>
        )
      ) : (
        <Text style={{ color: '#bbb', fontStyle: 'italic', margin: 8 }}>
          No options available for this Item
        </Text>
      )}
    </View>
  );
}, (prevProps, nextProps) => {
  if (prevProps.isQrOrder !== nextProps.isQrOrder) return false;
  // Only re-render if group or selectedOptions changed
  if (prevProps.group.id !== nextProps.group.id) return false;
  if (prevProps.group.options?.length !== nextProps.group.options?.length) return false;

  const prevSelected = prevProps.selectedOptions.find(opt => opt.parents === prevProps.group.id);
  const nextSelected = nextProps.selectedOptions.find(opt => opt.parents === nextProps.group.id);

  if (!prevSelected && !nextSelected) return true;
  if (!prevSelected || !nextSelected) return false;

  if (prevSelected.options.length !== nextSelected.options.length) return false;

  const prevSet = new Set(prevSelected.options);
  const nextSet = new Set(nextSelected.options);
  if (prevSet.size !== nextSet.size) return false;

  for (const id of prevSet) {
    if (!nextSet.has(id)) return false;
  }

  return true;
});

OptionGroup.displayName = 'OptionGroup';

// Optimized Crust Options Component
const CrustOptionsGroup = React.memo(({
  crustOptions,
  selectedOptions,
  handleOptionToggle,
  optionGroups,
  toast,
  isQrOrder = false,
}) => {
  const selectedCrustId = useMemo(() => {
    const crustGroup = selectedOptions.find(opt => opt.parents === 0);
    return crustGroup?.options[0] || null;
  }, [selectedOptions]);

  const crustData = useMemo(() => {
    const minQ = 0;
    const maxQ = 1;
    const selectedCount = selectedCrustId ? 1 : 0;

    return crustOptions.map(opt => ({
      ...opt,
      selected: opt.id === selectedCrustId,
      selectedCount,
      maxQ,
      minQ,
    }));
  }, [crustOptions, selectedCrustId]);

  const selectedCount = selectedCrustId ? 1 : 0;
  const maxQ = 1;
  const minQ = 0;
  const group = { id: 0, title: 'Choice of Pizza Size' };

  return (
    <View style={styles.optionsSection}>
      <Text style={styles.sectionTitle}>Choice of Pizza Size</Text>
      <View style={styles.optionsGrid}>
        {crustData.map(item => (
          <OptionCard
            key={item.id}
            item={item}
            parents={0}
            type="variation"
            onOptionToggle={handleOptionToggle}
            group={group}
            selected={item.selected}
            selectedCount={selectedCount}
            maxQ={maxQ}
            minQ={minQ}
            toast={toast}
            isQrOrder={isQrOrder}
          />
        ))}
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  if (prevProps.isQrOrder !== nextProps.isQrOrder) return false;
  if (prevProps.crustOptions.length !== nextProps.crustOptions.length) return false;

  const prevSelected = prevProps.selectedOptions.find(opt => opt.parents === 0);
  const nextSelected = nextProps.selectedOptions.find(opt => opt.parents === 0);

  if (!prevSelected && !nextSelected) return true;
  if (!prevSelected || !nextSelected) return false;
  if (prevSelected.options[0] !== nextSelected.options[0]) return false;

  return true;
});

CrustOptionsGroup.displayName = 'CrustOptionsGroup';

export default function MenuItemScreen() {
  // Removed useAuthGuard - menu item viewing accessible without login (App Store requirement)
  const router = useRouter();
  const toast = useToast();
  const { id, source, cart_item_id, is_free_item, amount, outletId, orderType, fromQR } = useLocalSearchParams();
  const [token, setToken] = useState('');
  const [itemPrice, setItemPrice] = useState(66);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [menuItem, setMenuItem] = useState(null);
  const [optionGroups, setOptionGroups] = useState([]);
  const [crustOptions, setCrustOptions] = useState([]);
  const [selectedCrustId, setSelectedCrustId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [variationPrice, setVariationPrice] = useState(0);
  const [optionTotal, setOptionTotal] = useState(0);
  const [baseOptionGroupIds, setBaseOptionGroupIds] = useState([]);
  const [note, setNote] = useState('');
  const [loadingCount, setLoadingCount] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mainImageLoading, setMainImageLoading] = useState(true);
  const mainImageLoadingTimeoutRef = useRef(null);

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

  const isFree = String(is_free_item) === '1' || String(is_free_item).toLowerCase() === 'true';
  const isQrOrder = String(fromQR) === '1';
  const maxQuantity = isFree ? Number(amount) || 1 : null;

  useEffect(() => {
    AsyncStorage.getItem('authToken').then(t => {
      setToken(t || '');
    });
  }, []);

  //get item details for edit
  useEffect(() => {
    if (!cart_item_id) return;
    const fetchCartItem = async () => {
      await runWithLoading(async () => {
        try {
          const res = await axios.get(`${apiUrl}cart/items/${cart_item_id}`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data.data) {
            const item = res.data.data;
            //setup variation
            setSelectedCrustId(item.variation_id);
            //setup options
            const optionPayload = Array.isArray(item.options)
              ? [
                ...Object.values(
                  item.options.reduce((acc, opt) => {
                    const groupId = opt.option_group_id;
                    if (!acc[groupId]) {
                      acc[groupId] = {
                        group_id: groupId,
                        parents: groupId,
                        options: []
                      };
                    }
                    if (opt.option_id) {
                      acc[groupId].options.push(opt.option_id);
                    }
                    return acc;
                  }, {})
                ),
                {
                  group_id: 0,
                  parents: 0,
                  options: item.variation_id ? [item.variation_id] : []
                }
              ]
              : [];

            setSelectedOptions(optionPayload);
            setItemPrice(item.line_subtotal);
            setQuantity(item.quantity);
            setVariationPrice(item?.variation?.price);
            if (item?.note) {
              setNote(item.note.slice(0, 30));
            } else {
              setNote('');
            }
          }
        } catch (err) {
          console.error('Failed to load cart item:', err?.response?.data || err.message);
        }
      });
    };
    fetchCartItem();
  }, [cart_item_id, token, runWithLoading]);

  useEffect(() => {
    console.log('MenuItemScreen params:', { id, outletId, token });
    if (!id) {
      console.log('Missing ID, skipping fetch');
      return;
    }

    const fetchMenuItem = async () => {
      console.log('Fetching menu item...', id);
      await runWithLoading(async () => {
        try {
          const outletDetails = await AsyncStorage.getItem('outletDetails');
          const outletIdToUse = outletId || (outletDetails ? JSON.parse(outletDetails).outletId : 0);

          const customerJson = await AsyncStorage.getItem('customerData');
          const customerData = customerJson ? JSON.parse(customerJson) : null;
          const customerTier = isQrOrder ? 0 : (customerData ? customerData.customer_tier_id : 0);

          console.log(`Requesting: ${apiUrl}menu-items/${id}/${outletIdToUse}/${customerTier}`);

          const res = await axios.get(`${apiUrl}menu-items/${id}/${outletIdToUse}/${customerTier}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Menu item fetched:', res.data.data[0]?.title);
          setMenuItem(res.data.data[0]);
          setBasePrice(Number(res.data.data[0]?.price) || 0);
          setBaseOptionGroupIds(res.data.data[0]?.menu_option_group?.map(g => g.id) || []);
          setMainImageLoading(true);
        } catch (err) {
          console.error('Failed to load menu item:', err?.response?.data || err.message);
          setMenuItem(null);
          setMainImageLoading(false);
        }
      });
    };

    fetchMenuItem();
  }, [id, token, runWithLoading, isQrOrder]);

  // Reset loading state when menuItem image changes
  const menuItemImageUrl = menuItem?.image?.[0]?.image_url;
  useEffect(() => {
    // Clear any existing timeout
    if (mainImageLoadingTimeoutRef.current) {
      clearTimeout(mainImageLoadingTimeoutRef.current);
      mainImageLoadingTimeoutRef.current = null;
    }

    if (menuItem && menuItemImageUrl !== undefined) {
      setMainImageLoading(true);
      // Fallback timeout to hide shimmer if image doesn't load within 3 seconds
      mainImageLoadingTimeoutRef.current = setTimeout(() => {
        setMainImageLoading(false);
        mainImageLoadingTimeoutRef.current = null;
      }, 3000);
    } else if (!menuItem) {
      // Hide shimmer if menuItem is null
      setMainImageLoading(false);
    }

    return () => {
      if (mainImageLoadingTimeoutRef.current) {
        clearTimeout(mainImageLoadingTimeoutRef.current);
        mainImageLoadingTimeoutRef.current = null;
      }
    };
  }, [menuItem, menuItemImageUrl]);

  useEffect(() => {
    // Early return if missing required data
    if (!menuItem) {
      setOptionGroups([]);
      return;
    }

    let groupList = [];
    let shouldFetchOptions = false;

    // Case 1: Variation is selected
    if (selectedCrustId) {
      const selectedVariationObj = Array.isArray(menuItem.variation)
        ? menuItem.variation.find(v => String(v.variation?.id) === String(selectedCrustId))
        : (menuItem.variation?.id === selectedCrustId ? menuItem.variation : null);

      if (selectedVariationObj?.option_groups?.length > 0) {
        groupList = selectedVariationObj.option_groups;
        shouldFetchOptions = true;
      }
    }
    // Case 2: No variation selected, check base item
    else if (baseOptionGroupIds?.length > 0) {
      groupList = baseOptionGroupIds.map(id => ({ id }));
      shouldFetchOptions = true;
    }

    // If no options to fetch, set empty array and return
    if (!shouldFetchOptions) {
      setOptionGroups([]);
      return;
    }

    // Filter out any invalid groups (missing ID)
    const validGroups = groupList.filter(group => group?.id);

    // If no valid groups after filtering, set empty array
    if (validGroups.length === 0) {
      setOptionGroups([]);
      return;
    }

    // Fetch option groups
    const fetchOptionGroups = async () => {
      await runWithLoading(async () => {
        try {
          const promises = validGroups.map(group =>
            axios.get(`${apiUrl}option/${group.id}`, {
              headers: { Authorization: `Bearer ${token}` },
              timeout: 5000
            }).catch(err => {
              console.warn(`Option group ${group.id} not found`);
              return null;
            })
          );

          const results = await Promise.all(promises);
          const successfulResults = results.filter(res => res !== null);

          if (successfulResults.length > 0) {
            const groupsData = successfulResults.map(res => res.data.data);
            const orderType = await AsyncStorage.getItem('orderType');
            if (orderType === 'delivery' || orderType === 'pickup') {
              if (groupsData.some(group => group.title === 'Takeaway Packaging')) {
                groupsData.forEach(group => {
                  if (group.title === 'Takeaway Packaging') {
                    group.is_required = 1;
                  }
                });
              }
            } else {
              if (groupsData.some(group => group.title === 'Takeaway Packaging')) {
                groupsData.forEach(group => {
                  if (group.title === 'Takeaway Packaging') {
                    group.is_required = 0;
                  }
                });
              }
            }

            setOptionGroups(groupsData);

            // 👇 Auto-select logic for required groups
            groupsData.forEach(group => {
              if (String(group.is_required) === "1" && group.options?.length === 1) {
                setSelectedOptions(prev => {
                  const alreadySelected = prev.find(opt => opt.group_id === group.id);
                  if (!alreadySelected) {
                    setItemPrice(currentPrice => currentPrice + Number(group.options[0].price_adjustment || 0));
                    return [
                      ...prev,
                      {
                        parents: group.id,
                        options: [group.options[0].id],
                        group_id: group.id
                      }
                    ];
                  }
                  return prev;
                });
              }
            });
          } else {
            setOptionGroups([]);
          }
        } catch (err) {
          console.error('Failed to load option groups:', err);
          setOptionGroups([]);
        }
      });
    };
    fetchOptionGroups();
  }, [menuItem, token, selectedCrustId, baseOptionGroupIds, runWithLoading]);


  useEffect(() => {
    if (!menuItem) return;
    if (Array.isArray(menuItem.variation) && menuItem.variation.length > 0) {
      setCrustOptions(
        menuItem.variation.map(v => {
          let imageUri = '';
          const imgPath = v.variation.images || v.variation.images_compressed || '';
          if (imgPath) {
            imageUri = imgPath.startsWith('http')
              ? imgPath
              : `${imageUrl}menu_variations/${imgPath}`;
          }
          return {
            id: v.variation.id,
            name: v.variation.title,
            price: Number(v.variation.price),
            discount_price: isQrOrder ? 0 : Number(v.variation.discount_price),
            image: imageUri,
            tags: v.tags || []
          };
        })
      );
    } else if (menuItem.variation && menuItem.variation.id) {
      let imageUri = '';
      const imgPath = menuItem.variation.images || menuItem.variation.images_compressed || '';
      if (imgPath) {
        imageUri = imgPath.startsWith('http')
          ? imgPath
          : `${imageUrl}menu_variations/${imgPath}`;
      }
      setCrustOptions([{
        id: menuItem.variation.id,
        name: menuItem.variation.title,
        price: Number(menuItem.variation.price),
        discount_price: isQrOrder ? 0 : Number(menuItem.variation.discount_price),
        image: imageUri,
      }]);
    } else {
      setCrustOptions([]);
    }
  }, [menuItem, isQrOrder]);

  useEffect(() => {
    let total = 0;
    selectedOptions.forEach(group => {
      group.options.forEach(id => {
        const groupObj = optionGroups.find(g => g.id === group.parents);
        const option = groupObj?.options?.find(o => o.id === id);
        total += Number(option?.price_adjustment || option?.price || 0);
      });
    });
    setOptionTotal(total);
  }, [selectedOptions, optionGroups]);

  // Memoized option toggle handler for better performance
  const handleOptionToggle = useCallback((optionId, optionPrice, isSelected, selectedCount, maxQ, minQ, group) => {
    const parents = group?.id || 0;

    if (parents === 0) {
      // Handle crust/variation selection
      if (isSelected) {
        setSelectedOptions(prev => prev.filter(option => option.parents !== parents));
        setItemPrice(prev => prev - optionPrice);
        setSelectedCrustId(null);
        setVariationPrice(0);
      } else {
        setSelectedOptions(prev => [
          ...prev.filter(option => option.parents !== parents),
          {
            parents: parents,
            options: [optionId],
            group_id: group?.id
          }
        ]);
        setItemPrice(prev => prev + optionPrice);
        setSelectedCrustId(optionId);
        setVariationPrice(optionPrice);
      }
    } else {
      // Handle regular option selection
      if (isSelected) {
        const isRequired = Number(group?.is_required) === 1;
        if (isRequired && maxQ === 1 && minQ === 1 || (group?.title === 'Takeaway Packaging' && isRequired)) {
          toast.show('This option is required', {
            type: 'custom_toast',
            data: { title: '', status: 'info' }
          });
          return;
        }
        setSelectedOptions(prev => prev.map(option =>
          option.parents === parents
            ? { ...option, options: option.options.filter(id => id !== optionId) }
            : option
        ));
        setItemPrice(prev => prev - optionPrice);
      } else {
        if (maxQ === 1) {
          setSelectedOptions(prev => {
            const existingOption = prev.find(option => option.parents === parents);
            if (existingOption) {
              return prev.map(option =>
                option.parents === parents
                  ? { ...option, options: [optionId] }
                  : option
              );
            } else {
              return [...prev, {
                parents: parents,
                options: [optionId],
                group_id: group?.id
              }];
            }
          });
          setItemPrice(prev => prev + optionPrice);
          return;
        }
        if (selectedCount >= maxQ) {
          toast.show(`You can only select up to ${maxQ} options for ${group?.title ?? parents}`, {
            type: 'custom_toast',
            data: { title: '', status: 'info' }
          });
          return;
        }
        setSelectedOptions(prev => {
          const existingOption = prev.find(option => option.parents === parents);
          if (existingOption) {
            return prev.map(option =>
              option.parents === parents
                ? { ...option, options: [...option.options, optionId] }
                : option
            );
          } else {
            return [...prev, {
              parents: parents,
              options: [optionId],
              group_id: group?.id
            }];
          }
        });
        setItemPrice(prev => prev + optionPrice);
      }
    }
  }, [toast]);

  const getCustomerData = async () => {
    try {
      const customerData = await AsyncStorage.getItem('customerData');
      return customerData ? JSON.parse(customerData) : null;
    } catch (error) {
      console.error('Error getting customer data:', error);
      return null;
    }
  };

  const handleUpdate = async () => {
    // Check if user is logged in - required for updating cart (order placement)
    const authToken = await AsyncStorage.getItem('authToken');
    const customerData = await getCustomerData();

    if (!authToken || !customerData || !customerData.id) {
      setShowLoginModal(true);
      return;
    }

    const outletDetails = await AsyncStorage.getItem('outletDetails');
    const parsedOutletDetails = JSON.parse(outletDetails);

    const optionPayload = selectedOptions
      .filter(opt => opt.parents !== 0 && opt.options?.length > 0)
      .map(opt => ({
        group_id: opt.group_id || opt.parents,
        option_ids: opt.options.map(Number),
      }));

    const payload = {
      customer_id: Number(customerData.id),
      outlet_id: parsedOutletDetails.outletId,
      cart_item_id: Number(cart_item_id),
      variation_id: selectedCrustId ? Number(selectedCrustId) : null,
      option: optionPayload,
      quantity: quantity,
      note: note,
      action: 2,
    };

    try {
      await runWithLoading(async () => {
        await axios.post(`${apiUrl}cart/update`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
      });

      toast.show('Cart updated', {
        type: 'custom_toast',
        data: { title: '', status: 'success' },
      });
      setTimeout(() => {
        router.push('/screens/orders/checkout');
      }, 1000);
    } catch (err) {
      console.error('Update error:', err?.response?.data || err.message);

      const backendMsg = err?.response?.data?.messages?.error
        || err?.response?.data?.message
        || 'Failed to update cart item';

      toast.show(backendMsg, {
        type: 'custom_toast',
        data: { title: 'Cart Update Failed', status: 'danger' },
      });
    }
  };

  const handleAddToCart = async () => {
    // Check if user is logged in - required for adding to cart (order placement)
    const authToken = await AsyncStorage.getItem('authToken');
    const customerData = await getCustomerData();

    if (!authToken || !customerData || !customerData.id) {
      setShowLoginModal(true);
      return;
    }

    const outletDetails = await AsyncStorage.getItem('outletDetails');
    if (!outletDetails) {
      toast.show('Please select an outlet first', {
        type: 'custom_toast',
        data: { title: 'Outlet Required', status: 'warning' }
      });
      return;
    }
    const parsedOutletDetails = JSON.parse(outletDetails);
    const uniqueQrDataRaw = await AsyncStorage.getItem('uniqueQrData');
    const uniqueQrData = uniqueQrDataRaw ? JSON.parse(uniqueQrDataRaw) : null;
    const deliveryAddressRaw = await AsyncStorage.getItem('deliveryAddressDetails');
    const deliveryAddress = deliveryAddressRaw ? JSON.parse(deliveryAddressRaw) : null;

    const optionPayload = selectedOptions
      .filter(opt => opt.parents !== 0 && opt.options?.length > 0)
      .map(opt => ({
        group_id: opt.group_id || opt.parents,
        option_ids: opt.options.map(Number),
      }));

    const safeQty = maxQuantity ? Math.min(quantity, maxQuantity) : quantity;
    const payload = {
      customer_id: Number(customerData.id),
      // outlet_id: menuItem?.outlet_id || 1,
      outlet_id: parsedOutletDetails.outletId,
      menu_item_id: Number(id),
      variation_id: selectedCrustId ? Number(selectedCrustId) : null,
      option: optionPayload,
      quantity: safeQty,
      ...(isFree ? { is_free_item: 1 } : {}),
      note: note,
      unique_qr_code: isQrOrder ? (uniqueQrData?.unique_code || deliveryAddress?.unique_code || null) : null,
    };
    // console.log('freeee', payload);

    try {
      const response = await runWithLoading(async () => {
        const res = await axios.post(`${apiUrl}cart/add`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        return res;
      });

      if (response.data.status === 200) {
        toast.show('Item added to cart', {
          type: 'custom_toast',
          data: { title: '', status: 'success' }

        });

        setTimeout(() => {
          if (outletId && orderType) {
            router.push({
              pathname: 'screens/menu',
              params: { outletId, orderType, fromQR: isQrOrder ? '1' : '0' }
            });
          } else {
            router.push('/menu');
          }
        }, 1000);
      }
      else if (response.data.status === 400) {
        const backendMsg =
          response.data?.messages?.error ||
          response.data?.message ||
          "Please select a pizza crust";
        toast.show(backendMsg, {
          type: 'custom_toast',
          data: { title: 'Cart Add Failed', status: 'danger' }
        });
      }
    } catch (err) {
      console.error('Failed to add to cart!');
      console.error(err?.response?.data || err.message);
      toast.show('Failed to add to cart', { type: 'error' });
    }
  };

  return (
    <ResponsiveBackground>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="MENU" isBackButton={true} />
        <ScrollView
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          scrollEventThrottle={16}
          decelerationRate="normal"
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          <View style={styles.imageContainer}>
            <View style={styles.mainImageWrapper}>
              <Image
                source={
                  menuItem?.image?.[0]?.image_url
                    ? {
                      uri: String(menuItem.image[0].image_url).startsWith('http')
                        ? String(menuItem.image[0].image_url)
                        : imageUrl + 'menu_images/' + String(menuItem.image[0].image_url),
                      cachePolicy: 'memory-disk'
                    }
                    : require('../../../assets/images/menu_default.jpg')
                }
                style={styles.mainImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
                onLoadStart={() => {
                  setMainImageLoading(true);
                  // Clear any existing timeout
                  if (mainImageLoadingTimeoutRef.current) {
                    clearTimeout(mainImageLoadingTimeoutRef.current);
                  }
                }}
                onLoadEnd={() => {
                  setMainImageLoading(false);
                  // Clear timeout since image loaded successfully
                  if (mainImageLoadingTimeoutRef.current) {
                    clearTimeout(mainImageLoadingTimeoutRef.current);
                  }
                }}
                onError={() => {
                  setMainImageLoading(false);
                  // Clear timeout on error
                  if (mainImageLoadingTimeoutRef.current) {
                    clearTimeout(mainImageLoadingTimeoutRef.current);
                  }
                }}
              />
              {mainImageLoading && (
                <ShimmerPlaceHolder
                  style={styles.shimmerMainImage}
                  shimmerColors={['#f0f0f0', '#e0e0e0', '#f0f0f0']}
                  autoRun={true}
                  duration={1500}
                />
              )}
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{menuItem?.title || 'Item'}</Text>
            <Text style={styles.description} numberOfLines={2} ellipsizeMode="tail">
              {menuItem?.long_description}
            </Text>
            <PolygonButton
              text="View More"
              width={80}
              height={20}
              color="#C2000E"
              textColor="#fff"
              textStyle={{ fontSize: 12 }}
              onPress={() => router.push({
                pathname: '/screens/menu/item_details',
                params: { id: menuItem.id }
              })}
            />
            <View style={styles.priceRow}>
              {!isQrOrder && menuItem?.discount_price && (
                <Text style={styles.originalPrice}>RM {menuItem.discount_price}</Text>
              )}
              <Text style={styles.price}>RM {menuItem?.price || '0'}</Text>
            </View>
          </View>

          <View style={styles.separator} />
          {crustOptions.length > 0 && (
            <CrustOptionsGroup
              crustOptions={crustOptions}
              selectedOptions={selectedOptions}
              handleOptionToggle={handleOptionToggle}
              optionGroups={optionGroups}
              toast={toast}
              isQrOrder={isQrOrder}
            />
          )}
          <View style={styles.separator} />
          {optionGroups.map(group => (
            <OptionGroup
              key={group.id}
              group={group}
              selectedOptions={selectedOptions}
              handleOptionToggle={handleOptionToggle}
              toast={toast}
              isQrOrder={isQrOrder}
            />
          ))}
          <View style={styles.noteSection}>
            <Text style={styles.sectionNote}>Note to restaurant</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add your request(subject to restaurant's discretion)"
              placeholderTextColor="#bbb"
              value={note}
              onChangeText={setNote}
              maxLength={30}
            />
          </View>
          <View style={styles.separator} />
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16, alignSelf: 'center' }}>
            {/* minus */}
            <TouchableOpacity
              onPress={() => setQuantity(q => Math.max(1, Number(q) - 1))}
              activeOpacity={0.8}
              style={styles.addButton}
            >
              <AntDesign name={'minus'} size={12} color={'#C2000E'} />
            </TouchableOpacity>

            {/* value */}
            <Text style={{ fontSize: 18, minWidth: 32, textAlign: 'center', color: 'black', fontWeight: 'bold' }}>
              {quantity}
            </Text>

            {/* plus */}
            <TouchableOpacity
              onPress={() => {
                if (!maxQuantity || quantity < maxQuantity) {
                  setQuantity(q => Number(q) + 1);
                }
              }}
              activeOpacity={0.8}
              style={[
                styles.addButton,
                maxQuantity && quantity >= maxQuantity && { backgroundColor: '#ddd', borderColor: '#aaa' }
              ]}
              disabled={maxQuantity && quantity >= maxQuantity}
            >
              <AntDesign name={'plus'} size={12} color={maxQuantity && quantity >= maxQuantity ? '#aaa' : '#C2000E'} />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomContainer}>
            <CustomTabBarBackground />
            <View style={styles.bottomRow}>
              <View style={styles.bottomRowWrapper}>
                <View style={styles.bottomRowWrapperLeft}>
                  <Image
                    source={require('../../../assets/elements/tabbar/menu_home.png')}
                    style={{ width: 70, height: 45 }}
                  />
                  <View style={styles.bottomPriceContainer}>
                    <Text style={styles.bottomPriceSmall}>RM </Text>
                    <Text style={styles.bottomPrice}>
                      {(() => {
                        if (isFree) return '0.00';
                        const total = Number(variationPrice) > 0
                          ? Number(variationPrice) + (Number(optionTotal) || 0)
                          : (Number(basePrice) || 0) + (Number(optionTotal) || 0);
                        const subTotal = total * quantity;
                        return isNaN(subTotal) ? '0.00' : subTotal.toFixed(2);
                      })()}
                    </Text>
                  </View>

                </View>
                <View style={styles.bottomRowWrapperRight}>
                  <PolygonButton
                    text={source === 'edit' ? 'Update Cart' : 'Add to Cart'}
                    width={120}
                    height={25}
                    color="#fff"
                    textColor="#C2000E"
                    textStyle={{
                      fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 18) : 18,
                    }}
                    onPress={source === 'edit' ? handleUpdate : handleAddToCart}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
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
        onConfirm={() => {
          setShowLoginModal(false);
          router.push('/screens/auth/login');
        }}
        onCancel={() => setShowLoginModal(false)}
      />
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  optionBottomRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commonCard: {
    width: (Math.min(width, 420) - 16 * 2 - 8) / 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  optionCardExtra: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionCardHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },

  optionImageLeft: {
    width: 60,
    height: 70,
    marginRight: 2,
    borderBottomLeftRadius: 8,
    borderTopLeftRadius: 8,
  },

  optionTextBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  variationCard: {
    width: (Math.min(width, 420) - 16 * 2 - 8) / 2,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    marginBottom: 12,
  },

  variationImage: {
    width: '100%',
    height: 80,
    borderRadius: 8,
    marginBottom: 6,
  },

  variationDetails: {
    alignItems: 'center',
    justifyContent: 'center',
  },

  variationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Route159-Regular',
    textAlign: 'center',
    marginBottom: 4,
  },

  variationPrice: {
    fontSize: 13,
    color: '#C2000E',
    fontFamily: 'Route159-SemiBoldItalic',
    marginBottom: 6,
  },
  // optionImageLeft: {
  //   width: 50,
  //   height: 50,
  //   borderRadius: 6,
  //   marginRight: 8,
  // },

  // optionTextBlock: {
  //   flex: 1,
  //   justifyContent: 'center',
  // },
  imageContainer: {
    position: 'relative',
  },
  mainImageWrapper: {
    marginHorizontal: 16,
    position: 'relative',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mainImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  shimmerMainImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  completedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#C2000E',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  completedText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  detailsContainer: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Route159-Bold',
    color: '#C2000E',
  },
  description: {
    fontSize: 12,
    color: '#666',
    marginVertical: 8,
    fontFamily: 'RobotoSlab-Regular',
    width: '100%',
    flexShrink: 1,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 12,
    fontFamily: 'Route159-SemiBoldItalic'
  },
  price: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C2000E',
    fontFamily: 'Route159-HeavyItalic'
  },
  basePriceText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    fontFamily: 'RobotoSlab-Regular'
  },
  separator: {
    height: 1,
    backgroundColor: '#C2000E',
    marginHorizontal: 16,
  },
  optionsSection: {
    paddingHorizontal: 16,
    width: '100%',
    maxWidth: 420, // max width for the grid container
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#C2000E',
    fontFamily: 'Route159-Bold',
    paddingTop: 16,
    paddingLeft: 0,
  },
  sectionNote: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#C2000E',
    fontFamily: 'Route159-Bold',
    paddingTop: 16,
    paddingLeft: 8,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: (Math.min(width, 420) - 16 * 2 - 8) / 2,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionImage: {
    width: '100%',
    height: 100,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  optionDetails: {
    paddingRight: 4,
    paddingLeft: 4,
    paddingBottom: 4,
    flex: 1,
  },
  optionName: {
    paddingTop: 4,
    fontSize: 13,
    fontFamily: 'Route159-Regular',
    minHeight: 35
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionOriginalPrice: {
    fontSize: 12,
    color: '#999',
    textDecorationLine: 'line-through',
    fontFamily: 'Route159-Regular',
    marginRight: 5
  },
  optionPrice: {
    // fontSize: Dimensions.get('window').width < 578 ? 12 : 16,
    fontSize: 12,
    color: '#C2000E',
    fontWeight: 'bold',
    fontFamily: 'Route159-SemiBoldItalic'
  },
  optionDiscountPrice: {
    fontSize: 11,
    color: '#999',
    textDecorationLine: 'line-through',
    fontFamily: 'Route159-SemiBoldItalic',
    marginRight: 5
  },
  addButton: {
    width: width < 400 ? 16 : 28,  // Smaller on mobile (width < 400), normal on desktop
    height: width < 400 ? 16 : 28, // Smaller on mobile (width < 400), normal on desktop
    borderRadius: width < 400 ? 11 : 14, // Adjusted border radius for the smaller size
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C2000E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteSection: {
    padding: 16
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#C2000E',
    borderRadius: 8,
    padding: 12,
    height: 100,
    textAlignVertical: 'top'
  },
  bottomContainer: {
    position: 'relative',
    marginTop: 20,
    width: '100%',
    backgroundColor: 'transparent',
  },
  bottomRow: {
    position: 'relative',
    width: '100%',
  },
  bottomRowWrapper: {
    flex: 1,
    flexDirection: 'row',
    bottom: '50%',
    justifyContent: 'space-between',
    marginHorizontal: 40,
  },
  bottomRowWrapperLeft: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomRowWrapperRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bottomPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingLeft: 15,
  },
  bottomPrice: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 20 : 18) : 18) : 22,
    fontFamily: 'Route159-HeavyItalic',
  },
  bottomPriceSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 12) : 18) : 18,
    fontFamily: 'Route159-HeavyItalic',
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
