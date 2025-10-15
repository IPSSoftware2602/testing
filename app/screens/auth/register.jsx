import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, commonStyles } from '../../../styles/common';
import TopNavigation from '../../../components/ui/TopNavigation';
import DateSelector from '../../../components/ui/DateSelector';
import PolygonButton from '../../../components/ui/PolygonButton';
import ImageUpload from '../../../components/ui/ImageUpload';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [birthday, setBirthday] = useState(new Date().toISOString().split('T')[0]);
  const [profileImage, setProfileImage] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const [referralId, setReferralId] = useState("");
  const toast = useToast();

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const referralId = await AsyncStorage.getItem('referralId');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;

        if (!customerData) {
          router.push('/screens/auth/login');
        }
        setAuthToken(authToken);
        setReferralId(referralId);
        setCustomerData(customerData);
      } catch (err) {
        console.log(err);
        router.push('/screens/auth/login');
      }
    };

    checkStoredData();
  }, [router])

  function dataURItoBlob(dataURI) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: mimeString });
  }

  useEffect(() => {
    console.log(profileImage);
  }, [profileImage]);

  const handleRegister = async () => {
    console.log(birthday);

    const formData = new FormData();
    if (profileImage) {
      // const fileName = Platform.OS === 'android' ? profileImage.fileName : profileImage.name;
      if (profileImage.uri.startsWith('data:image')) {
        const blob = dataURItoBlob(profileImage.uri);
        formData.append('profile_picture', blob, profileImage.name || profileImage.fileName);
      } else {
        formData.append('profile_picture', {
          uri: profileImage.uri,
          type: profileImage.mimeType || 'image/jpeg',
          name: profileImage.fileName || 'profile_image.jpeg',
        });
      }
    }
    formData.append('name', name);
    formData.append('email', email);
    formData.append('birthday', birthday);
    { referralId && formData.append('customer_referral_code', referralId); }

    console.log(referralId);

    try {
      const response = await axios.post(
        apiUrl + "update-profile/" + customerData.id, formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );
      const updateProfileData = await response.data;
      console.log(updateProfileData);

      if (updateProfileData.status === "success") {
        const jsonCustomerData = JSON.stringify(updateProfileData.data);
        await AsyncStorage.setItem('customerData', jsonCustomerData);
        toast.show('Profile updated successfully', {
          type: 'custom_toast',
          data: { title: 'Successfully', status: 'success' }
        });

        // setTimeout(() => {
        //   router.replace('(tabs)');
        // }, 2000);
        // Alert.alert('Successful', 'Profile updated successfully')
        await AsyncStorage.removeItem('referralId');
        router.replace('(tabs)');
      }
    } catch (err) {
      // console.log(err.message);
      toast.show('Please try again', {
        type: 'custom_toast',
        data: { title: 'Update Profile Failed', status: 'danger' }
      });
      // Alert.alert('Update Profile Failed', 'Please try again')
      if (err.response) {
        console.log('Response data:', err.response.data);
        console.log('Response data:', err.response.status);
      }
    }
  };

  return (
    <ResponsiveBackground>
      <SafeAreaView style={[commonStyles.container, styles.container]}>
        <TopNavigation title="Update Profile" isBackButton={false} />
        <View style={styles.logoContainer}>
          <ImageUpload
            value={profileImage}
            onImageChange={setProfileImage}
            size={120}
            imageStyle={styles.logo}
          />
        </View>

        <View style={styles.form}>
          <TextInput
            style={commonStyles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            value={name}
            onChangeText={setName}
          />

          <TextInput
            style={commonStyles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <DateSelector
            value={birthday}
            onDateChange={setBirthday}
            placeholder="Select Birthday"
            style={commonStyles.input}
          />

          <PolygonButton
            text="Update Profile"
            width={180}
            height={40}
            onPress={handleRegister}
            color="#C2000E"
            textColor="#fff"
            textStyle={{ fontSize: 22, fontWeight: 'bold' }}
            style={{ marginTop: 20, alignSelf: 'center' }}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Please complete your profile to proceed. </Text>
          </View>
        </View>
      </SafeAreaView>
    </ResponsiveBackground>
  );
}

const styles = {
  container: {
    flex: 1,
    backgroundColor: '#FEF2E2',
  },
  logoContainer: {
    alignItems: 'center',
    paddingHorizontal: 16,
    marginVertical: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textLight,
  },
  form: {
    width: '100%',
    paddingHorizontal: 16,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    color: colors.textLight,
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
}; 