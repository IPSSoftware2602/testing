import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, Linking, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign } from '@expo/vector-icons';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';

const { width } = Dimensions.get('window');

export default function NotificationDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('Invalid notification');
      setLoading(false);
      return;
    }

    const fetchNotification = async () => {
      try {
        const res = await axios.get(`${apiUrl}app-notifications/${id}`);
        if (res?.data?.data) {
          setNotification(res.data.data);
        } else {
          setError('Notification not found');
        }
      } catch (err) {
        console.error('Failed to load notification:', err?.response?.data || err.message);
        setError('Failed to load notification');
      } finally {
        setLoading(false);
      }
    };

    fetchNotification();
  }, [id]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const handleOpenUrl = () => {
    if (notification?.url_link) {
      Linking.openURL(notification.url_link).catch(err =>
        console.error('Failed to open URL:', err)
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <AntDesign name="arrowleft" size={22} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#C2000E" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AntDesign name="exclamationcircleo" size={48} color="#bbb" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {notification?.image_url ? (
            <Image
              source={{ uri: notification.image_url }}
              style={styles.image}
              resizeMode="cover"
            />
          ) : null}

          <View style={styles.body}>
            <Text style={styles.title}>{notification?.title || 'Notification'}</Text>

            {notification?.created_at ? (
              <Text style={styles.date}>{notification.created_at}</Text>
            ) : null}

            <Text style={styles.message}>{notification?.message || ''}</Text>

            {notification?.content ? (
              <Text style={styles.content}>{notification.content}</Text>
            ) : null}

            {notification?.url_link ? (
              <TouchableOpacity style={styles.linkBtn} onPress={handleOpenUrl} activeOpacity={0.8}>
                <Text style={styles.linkBtnText}>Learn More</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Route159-Bold',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: '#888',
    fontFamily: 'Route159-Regular',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  image: {
    width: width,
    height: width * 0.6,
    backgroundColor: '#f5f5f5',
  },
  body: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 6,
    fontFamily: 'Route159-Bold',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    fontFamily: 'Route159-Regular',
  },
  message: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'Route159-Regular',
  },
  content: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    fontFamily: 'Route159-Regular',
  },
  linkBtn: {
    backgroundColor: '#C2000E',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  linkBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'Route159-Bold',
  },
});
