import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import axios from 'axios';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl, imageUrl } from '../../constant/constants';
import useAuthGuard from '../../auth/check_token_expiry';

export default function ItemDetailsScreen() {
  useAuthGuard();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [menuItem, setMenuItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [itemPrice, setItemPrice] = useState(66);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const fetchMenuItem = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const outletDetails = await AsyncStorage.getItem('outletDetails');
        const outletId = outletDetails ? JSON.parse(outletDetails).outletId : 0;
        const res = await axios.get(`${apiUrl}menu-items/${id}/${outletId}`, { headers });
        if (res.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setMenuItem(res.data.data[0]);
          setItemPrice(Number(res.data.data[0]?.price) || 0);
        } else {
          setMenuItem(null);
        }
      } catch (err) {
        setMenuItem(null);
        console.error('API error:', err, err?.response?.data);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItem();
  }, [id]);

  return (
    <ResponsiveBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView>
          <View style={styles.imageContainer}>
            <Image
              source={{
                uri: menuItem?.image?.[0]?.image_url
                  ? menuItem.image[0].image_url
                  : require('../../../assets/images/menu_default.jpg'),
              }}
              style={styles.image}
            />
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="chevron-back" size={28} color="#C2000E" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentContainer}>
            <Text style={styles.name}>{menuItem?.title || '-'}</Text>
            <Text style={styles.price}>RM {menuItem?.price || '-'}</Text>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Description</Text>
              <Text style={styles.sectionContent}>{menuItem?.short_description || '-'}</Text>
            </View>
          </View>
        </ScrollView>
        <Text style={styles.footerNote}>
        All prices or charges are subject to a<br /> 10% service charge and 6% SST
      </Text>
      </SafeAreaView>
    </ResponsiveBackground>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 300,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 4,
  },
  contentContainer: {
    padding: 20,
  },
  name: {
    fontSize: 26,
    fontFamily: 'Route159-Bold',
    color: '#C2000E',
    marginBottom: 8,
  },
  price: {
    fontSize: 22,
    fontFamily: 'Route159-HeavyItalic',
    color: '#C2000E',
    marginBottom: 24,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Route159-SemiBold',
    color: '#888',
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 14,
    fontFamily: 'RobotoSlab-Regular',
    color: '#555',
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: '#C2000E',
    marginVertical: 10,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 16,
    color: '#C2000E',
    marginVertical: 10,
    paddingHorizontal: 16,
    fontFamily: 'Route159-SemiBold',
  },
});
