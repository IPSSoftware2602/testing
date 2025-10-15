import { Fontisto } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { imageUrl, apiUrl } from '../../constant/constants'
import { useRouter } from 'expo-router';
import useCheckValidOrderType from '../home/check_valid_order_type';
import useAuthGuard from '../../auth/check_token_expiry';

const { width } = Dimensions.get('window');

export default function Market() {
  const [marketItems, setMarketItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const router = useRouter();
  useAuthGuard();
  useCheckValidOrderType();

  const filteredItems = marketItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }) => (
    // console.log(item.image),
    <View style={styles.productCard}>
      <TouchableOpacity onPress={() => router.push(`/screens/market/voucher_details?id=${item.id}`)}>
        <Image
          source={{ uri: item.image }}
          style={{
            width: Math.min(width * 0.45, 440 * 0.45),
            height: 120,
            borderRadius: 12,
            marginBottom: 8,
            backgroundColor: '#d16c6cff',
          }}
        />
      </TouchableOpacity>
      <Text style={styles.productName}>{item.name}</Text>
      <View style={styles.productPriceWrapper}>
        <View style={styles.productPriceContainer}>
          <Text style={styles.productPrice}>{item.price}</Text>
          <Text style={styles.productBeans}> US Beans</Text>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    const fetchMarketItems = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const res = await axios.get(`${apiUrl}voucher-point/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.status === 200 && Array.isArray(res.data.data)) {

          const items = res.data.data.map(item => ({
            id: item.id,
            name: item.voucher_name,
            price: item.voucher_point_redeem,
            image: item.voucher_image
              ? `${imageUrl}vouchers/${item.voucher_image}`
              : `${imageUrl}vouchers/1750740152_685a2cb830c36.jpg`,
          }));
          setMarketItems(items);
        }
      } catch (err) {
        console.error('Failed to fetch market items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMarketItems();
  }, []);

  const ListHeader = useCallback(() => (
    <>
      {/* Promo Banner */}
      <View style={styles.promoBanner}>
        <Image
          source={require('../../../assets/images/promo_pizza1.png')}
          style={styles.promoImage}
        />
        <Text style={styles.promoBannerText}>Points redemption</Text>
      </View>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Fontisto name="search" size={18} color="#bbb" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          placeholderTextColor="#bbb"
          value={search}
          onChangeText={setSearch}
        />
      </View>
      {/* Mall Tabs */}
      <View style={styles.mallTabs}>
        <Text style={styles.mallTabActive}>Voucher Mall</Text>
      </View>
    </>
  ), [search, setSearch]);

  return (
    <ResponsiveBackground>
      {/* <View style={commonStyles.outerWrapper}>
      <View style={commonStyles.contentWrapper}> */}
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
        <TopNavigation title="MARKET" isBackButton={false} />
        <FlatList
          style={commonStyles.containerStyle}
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          ListHeaderComponent={ListHeader()}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90, zIndex: 1, }}
        />
        {loading && <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading...</Text>}
      </SafeAreaView>
      {/* </View>
    </View> */}
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  promoBanner: {
    margin: 16,
    borderRadius: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  promoImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  promoBannerText: {
    position: 'absolute',
    top: 16,
    left: 20,
    // color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    fontFamily: 'Route159-HeavyItalic',
    color: '#C2000E',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    height: 38,
  },
  searchIcon: {
    fontSize: 18,
    color: '#bbb',
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
    fontFamily: 'RobotoSlab-Regular',
    paddingHorizontal: 10,
    outlineStyle: 'none',
  },
  mallTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  mallTabInactive: {
    color: '#bbb',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
  },
  mallTabSlash: {
    color: '#bbb',
    fontWeight: 'bold',
    fontSize: 16,
    marginHorizontal: 4,
  },
  mallTabActive: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-HeavyItalic',
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  productCard: {
    borderRadius: 16,
    width: (Math.min(width, 440) - 48) / 1.95,
    marginBottom: 8,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#d16c6cff',
  },
  productName: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 14) : 18) : 16,
    color: '#333',
    marginBottom: 0,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
    paddingBottom: 6,
  },
  productPrice: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 14) : 18) : 16,
    fontFamily: 'Route159-HeavyItalic',
    paddingLeft: 5,
    paddingRight: 5,
    textAlign: 'center',
  },
  productBeans: {
    color: '#C2000E',
    fontSize: 14,
    fontFamily: 'Route159-Regular',
    marginRight: 6,
  },
  productAddBtn: {
    backgroundColor: '#C2000E',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  productAddBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    fontFamily: 'Route159-Bold',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 8,
    justifyContent: 'space-between',
    zIndex: 10,
  },
  bottomBarBeans: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-Bold',
  },
  bottomBarBeansValue: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 22,
    fontFamily: 'Route159-HeavyItalic',
    marginLeft: 4,
  },
  productPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productPriceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
});