import { AntDesign } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useMemo } from 'react';
import { Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
import PropTypes from 'prop-types'
import useAuthGuard from '../../auth/check_token_expiry';

const { width } = Dimensions.get('window');

const OptionCard = React.memo(({
  item,
  parents,
  type = 'option',
  selectedOptions,
  setSelectedOptions,
  optionGroups,
  itemPrice,
  setItemPrice,
  selectedCrustId,
  setSelectedCrustId,
  variationPrice,
  setVariationPrice,
  toast
}) => {
  const tags = item.tags || [];
  const selected = selectedOptions.find(option => option.parents === parents)?.options.includes(item.id);
  const group = optionGroups.find(g => g.id === parents);

  const minQ = Number(group?.min_quantity || 0);
  const rawMaxQ = Number(group?.max_quantity || 0);
  const maxQ = (minQ === 0 && rawMaxQ === 0) ? Infinity : (rawMaxQ || 99);

  const selectedOptionGroup = selectedOptions.find(option => option.parents === parents);
  const selectedCount = selectedOptionGroup?.options.length || 0;

  const imageSource = item.image
    ? { uri: item.image }
    : require('../../../assets/images/menu_default.jpg');

  const handlePress = () => {
    if (parents === 0) {
      if (selected) {
        setSelectedOptions(selectedOptions.filter(option => option.parents !== parents));
        setItemPrice(itemPrice - item.price);
        setSelectedCrustId(null);
        setVariationPrice(0);
      } else {
        setSelectedOptions([
          ...selectedOptions.filter(option => option.parents !== parents),
          {
            parents: parents,
            options: [item.id],
            group_id: group?.id
          }
        ]);
        setItemPrice(itemPrice + item.price);
        setSelectedCrustId(item.id);
        setVariationPrice(item.price);
      }
    } else {
      // Original logic for other options
      if (selected) {
        console.log(123);
        setSelectedOptions(selectedOptions.map(option =>
          option.parents === parents
            ? { ...option, options: option.options.filter(id => id !== item.id) }
            : option
        ));
        setItemPrice(itemPrice - item.price);
      } else {
        if(maxQ === 1){
          console.log(456);
          const existingOption = selectedOptions.find(option => option.parents === parents);
          if (existingOption) {
            console.log(selectedOptions);
            setSelectedOptions(selectedOptions.map(option =>
              option.parents === parents
                ? { ...option,options: [item.id] }
                : option
            ));
            setItemPrice(itemPrice + item.price);
          }
          return;
        }
        if (selectedCount >= maxQ) {
          toast.show(`You can only select up to ${maxQ} options for ${group?.title ?? parents}`, {
            type: 'custom_toast',
            data: { title: '', status: 'info' }
          });
          return;
        }
        const existingOption = selectedOptions.find(option => option.parents === parents);
        if (existingOption) {
          setSelectedOptions(selectedOptions.map(option =>
            option.parents === parents
              ? { ...option, options: [...option.options, item.id] }
              : option
          ));
        } else {
          setSelectedOptions([...selectedOptions, {
            parents: parents,
            options: [item.id],
            group_id: group?.id
          }]);
        }
        setItemPrice(itemPrice + item.price);
      }
    }
  };

  const imageStyle = type === 'variation'
    ? {
      width: '100%',
      height: 80,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
    }
    : styles.optionImageLeft;

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
      <Image source={imageSource} style={imageStyle} />
      <View style={styles.optionDetails}>
        <Text style={styles.optionName}>{item.name}</Text>
        <View style={styles.optionRow}>
          <Text style={styles.optionPrice}>
            {item.price > 0 ? `+RM ${item.price.toFixed(2)}` : `RM ${item.price.toFixed(2)}`}
          </Text>
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
});

OptionCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.number.isRequired,
    image: PropTypes.string,
    tags: PropTypes.array
  }).isRequired,
  parents: PropTypes.number.isRequired,
  type: PropTypes.oneOf(['option', 'variation']),
  selectedOptions: PropTypes.array.isRequired,
  setSelectedOptions: PropTypes.func.isRequired,
  optionGroups: PropTypes.array.isRequired,
  itemPrice: PropTypes.number.isRequired,
  setItemPrice: PropTypes.func.isRequired,
  selectedCrustId: PropTypes.number,
  setSelectedCrustId: PropTypes.func.isRequired,
  variationPrice: PropTypes.number.isRequired,
  setVariationPrice: PropTypes.func.isRequired,
  toast: PropTypes.object.isRequired
};

// Add default props (optional)
OptionCard.defaultProps = {
  type: 'option',
  selectedCrustId: null
};
OptionCard.displayName = 'OptionCard';

export default function MenuItemScreen() {
  useAuthGuard();
  const router = useRouter();
  const toast = useToast();
  const { id, source, cart_item_id, is_free_item, amount } = useLocalSearchParams();
  // console.log('amount', amount);
  const [token, setToken] = useState('');
  const [itemPrice, setItemPrice] = useState(66);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optionGroups, setOptionGroups] = useState([]);
  const [crustOptions, setCrustOptions] = useState([]);
  const [selectedCrustId, setSelectedCrustId] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [basePrice, setBasePrice] = useState(0);
  const [variationPrice, setVariationPrice] = useState(0);
  const [optionTotal, setOptionTotal] = useState(0);
  const [baseOptionGroupIds, setBaseOptionGroupIds] = useState([]);

  const isFree = String(is_free_item) === '1' || String(is_free_item).toLowerCase() === 'true';
  const maxQuantity = isFree ? Number(amount) || 1 : null;

  useEffect(() => {
    AsyncStorage.getItem('authToken').then(t => {
      setToken(t || '');
    });
  }, []);

  //get item details for edit
  useEffect(() => {
    if (!cart_item_id || !token) return;
    console.log('cart_item_id', cart_item_id);
    const fetchCartItem = async () => {
      const res = await axios.get(`${apiUrl}cart/items/${cart_item_id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.data) {
        const item = res.data.data;
        //setup variation
        setSelectedCrustId(item.variation_id);
        // setVariationPrice(item.variation.price.toFixed(2));
        //setup options
        // Fix: Properly handle option payload and avoid duplicate crust option if already present
        // Group options by group_id and aggregate option_ids
        const optionPayload = Array.isArray(item.options)
          ? [
            ...Object.values(
              item.options.reduce((acc, opt) => {
                const groupId = opt.option_group_id;
                if (!acc[groupId]) {
                  acc[groupId] = {
                    group_id: groupId,
                    // parents: opt.option_group_title,
                    parents: groupId,
                    options: []
                  };
                }
                // Add the option_id to the options array (as number)
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
      }
    };
    fetchCartItem();
  }, [cart_item_id, token]);

  useEffect(() => {
    if (!id || !token) return;
    setLoading(true);

    const fetchMenuItem = async () => {
      try {
        const res = await axios.get(`${apiUrl}menu-items/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMenuItem(res.data.data[0]);
        // setItemPrice(Number(res.data.data[0]?.price) || 0);
        setBasePrice(Number(res.data.data[0]?.price) || 0);
        setBaseOptionGroupIds(res.data.data[0]?.menu_option_group?.map(g => g.id) || []);
      } catch (err) {
        console.log(err);
        setMenuItem(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [id, token]);

  useEffect(() => {
    // Early return if missing required data
    if (!menuItem || !token) {
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

      setOptionGroups(groupsData);

      // 👇 Auto-select logic for required groups
      groupsData.forEach(group => {
        if (String(group.is_required) === "1" && group.options?.length === 1) {
          const alreadySelected = selectedOptions.find(opt => opt.group_id === group.id);
          if (!alreadySelected) {
            setSelectedOptions(prev => [
              ...prev,
              {
                parents: group.id,
                options: [group.options[0].id],
                group_id: group.id
              }
            ]);
            setItemPrice(prev => prev + Number(group.options[0].price_adjustment || 0));
          }
        }
      });
    } else {
      setOptionGroups([]);
    }
  } catch (err) {
    console.error('Failed to load option groups:', err);
    setOptionGroups([]);
  }
};
    fetchOptionGroups();
  }, [menuItem, token, selectedCrustId, baseOptionGroupIds]);
  useEffect(() => {
  if (!menuItem || !token) return;

  // First preference: variation groups
  let groupList = [];
  if (selectedCrustId && Array.isArray(menuItem.variation)) {
    const selectedVariation = menuItem.variation.find(v => String(v.variation?.id) === String(selectedCrustId));
    if (selectedVariation?.option_groups?.length) {
      groupList = selectedVariation.option_groups;
    }
  }

  // Fallback: base menu groups
  if (!groupList.length && menuItem.menu_option_group?.length) {
    groupList = menuItem.menu_option_group;
  }

  if (!groupList.length) return;

  const fetchOptionGroups = async () => {
    try {
      const results = await Promise.all(
        groupList.map(group =>
          axios.get(`${apiUrl}option/${group.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }).catch(() => null)
        )
      );

      const successful = results.filter(Boolean).map(r => r.data.data);
      setOptionGroups(successful);
    } catch (err) {
      console.error("Failed to load option groups:", err);
    }
  };

  fetchOptionGroups();
}, [menuItem, token, selectedCrustId]);

  useEffect(() => {
    if (!menuItem) return;
    if (Array.isArray(menuItem.variation) && menuItem.variation.length > 0) {
      setCrustOptions(
        menuItem.variation.map(v => ({
          id: v.variation.id,
          name: v.variation.title,
          price: Number(v.variation.price),
          image: v.variation.images || v.variation.images_compressed || '',
          tags: v.tags || []
        }))
      );
    } else if (menuItem.variation && menuItem.variation.id) {
      setCrustOptions([{
        id: menuItem.variation.id,
        name: menuItem.variation.title,
        price: Number(menuItem.variation.price),
        image: '',
      }]);
    } else {
      setCrustOptions([]);
    }
  }, [menuItem]);

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
    const outletDetails = await AsyncStorage.getItem('outletDetails');
    // if (outletDetails) {
    const parsedOutletDetails = JSON.parse(outletDetails);
    const customerData = await getCustomerData();
    if (!customerData || !customerData.id) {
      toast.show('Customer data not found', { type: 'error' });
      return;
    }

    console.log(optionGroups);
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
      action: 2,
    };

    try {
      await axios.post(`${apiUrl}cart/update`, payload, {
        headers: { Authorization: `Bearer ${token}` },
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
    const customerData = await getCustomerData();
    const outletDetails = await AsyncStorage.getItem('outletDetails');
    // if (outletDetails) {
    const parsedOutletDetails = JSON.parse(outletDetails);
    // }
    if (!customerData || !customerData.id || !outletDetails) {
      console.error("Customer data not found");
      toast.show('Customer data not found', { type: 'error' });
      return;
    }

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

        setTimeout(() => {
          router.push('/menu');
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
        <TopNavigation title="MENU" isBackButton={true} navigatePage={() => router.push('(tabs)/menu')} />
        <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: menuItem?.image?.[0]?.image_url
                  ? menuItem.image[0].image_url
                  : require('../../../assets/images/menu_default.jpg'),
              }}
              style={styles.mainImage}
            />
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
              <Text style={styles.originalPrice}>RM {menuItem?.price || '0'}</Text>
              <Text style={styles.price}>RM {menuItem?.price || '0'}</Text>
            </View>
          </View>

          <View style={styles.separator} />
          {crustOptions.length > 0 ? (
            <View style={styles.optionsSection}>
              <Text style={styles.sectionTitle}>Choice of Pizza Size</Text>
              <View style={styles.optionsGrid}>
                {crustOptions.map((item, index) => (
                  <OptionCard
                    key={item.id}
                    item={item}
                    // parents="Choice of Pizza Crust(P)"
                    parents={0}
                    type="variation"
                    selectedOptions={selectedOptions}
                    setSelectedOptions={setSelectedOptions}
                    optionGroups={optionGroups}
                    itemPrice={itemPrice}
                    setItemPrice={setItemPrice}
                    selectedCrustId={selectedCrustId}
                    setSelectedCrustId={setSelectedCrustId}
                    setVariationPrice={setVariationPrice}
                    toast={toast}
                  />

                ))}
              </View>
            </View>
          ) : null}
          <View style={styles.separator} />
          {optionGroups.map(group => (
            <View key={group.id} style={styles.optionsSection}>
              <Text style={styles.sectionTitle}>
                {group.title}
                {String(group.is_required) === "1" ? <Text style={{ color: '#C2000E' }}> *</Text> : null}
              </Text>
              <View style={styles.optionsGrid}>
                {group.options && group.options.length > 0 ? (
                  group.options.map(opt => (
                    <OptionCard
                      key={opt.id}
                      item={{
                        id: opt.id,
                        name: opt.title,
                        price: Number(opt.price_adjustment ?? opt.price ?? 0),
                        image: opt.images_compressed || opt.images || '',
                      }}
                      parents={group.id}
                      type="option"
                      selectedOptions={selectedOptions}
                      setSelectedOptions={setSelectedOptions}
                      optionGroups={optionGroups}
                      itemPrice={itemPrice}
                      setItemPrice={setItemPrice}
                      selectedCrustId={selectedCrustId}
                      setSelectedCrustId={setSelectedCrustId}
                      setVariationPrice={setVariationPrice}
                      toast={toast}
                    />
                  ))
                ) : (
                  <Text style={{ color: '#bbb', fontStyle: 'italic', margin: 8 }}>No options available for this Item</Text>
                )}
              </View>
            </View>
          ))}
          <View style={styles.noteSection}>
            <Text style={styles.sectionNote}>Note to restaurant</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Add your request(subject to restaurant's discretion)"
              placeholderTextColor="#bbb"
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
  mainImage: {
    marginHorizontal: 16,
    borderRadius: 12,
    height: 180,
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
});
