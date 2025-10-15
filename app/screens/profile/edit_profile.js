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
import useAuthGuard from '../../auth/check_token_expiry';
import { Platform } from "react-native";

export default function UpdateProfile() {
  useAuthGuard();
  const router = useRouter();
  // const [name, setName] = useState('');
  // const [email, setEmail] = useState('');
  // const [birthday, setBirthday] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [customerData, setCustomerData] = useState(null);
  const [authToken, setAuthToken] = useState("");
  const toast = useToast();

  useEffect(() => {
    const checkStoredData = async () => {
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        const customerJson = await AsyncStorage.getItem('customerData');
        const customerData = customerJson ? JSON.parse(customerJson) : null;

        if (!customerData) {
          router.push('/screens/auth/login');
        }
        setAuthToken(authToken);
        setCustomerData(customerData);
      } catch (err) {
        console.log(err);
        router.push('/screens/auth/login');
      }
    };

    checkStoredData();
  }, [router])


  useEffect(() => {
    const fetchCustomerProfile = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}customers/profile/${customerData.id}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
          });

        const updatedCustomerData = response.data.data

        await AsyncStorage.setItem(
          'customerData',
          JSON.stringify({
            ...customerData, // Existing data
            ...updatedCustomerData, // New updates
          })
        );

        setCustomerData((prev) => ({
          ...prev,
          ...updatedCustomerData,
        }));

        setProfileImage({
          uri: updatedCustomerData.profile_picture_url,
          type: 'image/jpeg',
          name: 'profile_image.jpeg',
        })

      } catch (err) {
        console.log(err);
      }

    }

    if (authToken && customerData?.id) {
      fetchCustomerProfile();
    }

  }, [authToken, customerData?.id])

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

  // useEffect(() => {
  //   console.log(profileImage);
  // }, [profileImage]);

  const handleInputChange = (field, value) => {
    setCustomerData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  const handleUpdateProfile = async () => {
  const formData = new FormData();

  if (profileImage) {
    if (Platform.OS === "web") {
      // Web: fetch blob from URL
      const res = await fetch(profileImage.uri);
      const blob = await res.blob();
      formData.append(
        "profile_picture",
        blob,
        profileImage.name || "profile_image.jpeg"
      );
    } else {
      // Native: use { uri, type, name }
      formData.append("profile_picture", {
        uri: profileImage.uri,
        type: profileImage.mimeType || profileImage.type || "image/jpeg",
        name:
          profileImage.fileName ||
          profileImage.name ||
          "profile_image.jpeg",
      });
    }
  }

  formData.append("name", customerData.name || "");
  formData.append("email", customerData.email || "");
  formData.append("birthday", customerData.birthday || "");

  // Debug
  for (let pair of formData.entries()) {
    console.log(pair[0], pair[1]);
  }

  try {
    const response = await axios.post(
      `${apiUrl}update-profile/${customerData.id}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const updateProfileData = response.data;
    console.log(updateProfileData);

    if (updateProfileData.status === "success") {
      await AsyncStorage.setItem(
        "customerData",
        JSON.stringify(updateProfileData.data)
      );
      toast.show("Profile updated successfully", {
        type: "custom_toast",
        data: { title: "Successfully", status: "success" },
      });
      router.replace("(tabs)");
    }
  } catch (err) {
    toast.show("Please try again", {
      type: "custom_toast",
      data: { title: "Update Profile Failed", status: "danger" },
    });
    if (err.response) {
      console.log("Response data:", err.response.data);
      console.log("Response status:", err.response.status);
    }
  }
};

  return (
    <ResponsiveBackground>
      <SafeAreaView style={[commonStyles.container, styles.container]}>
        <TopNavigation title="Update Profile" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
        <View style={styles.logoContainer}>
          {customerData && <ImageUpload
            value={profileImage}
            onImageChange={setProfileImage}
            size={120}
            imageStyle={styles.logo}
          />}
        </View>

        <View style={styles.form}>
          {customerData && <><TextInput
            style={commonStyles.input}
            placeholder="Name"
            placeholderTextColor="#999"
            // value={name}
            // onChangeText={setName}
            value={customerData.name}
            onChangeText={(value) => handleInputChange("name", value)}
          />

            <TextInput
              style={commonStyles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              // value={email}
              // onChangeText={setEmail}
              value={customerData.email}
              onChangeText={(value) => handleInputChange("email", value)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <DateSelector
              value={customerData.birthday}
              // onDateChange={setBirthday}
              placeholder="Select Birthday"
              style={commonStyles.input}
              isDisabled={true}
            />

            <TextInput
              style={[commonStyles.input, { backgroundColor: '#ddd', color: '#999', cursor: 'default' }]}
              placeholder="Phone Number"
              placeholderTextColor="#999"
              value={customerData.phone}
              editable={false}
              selectTextOnFocus={false}
            /></>}

            {Platform.OS === 'web' ? (
              <div data-testid="update-profile-button" style={{ display: 'flex', justifyContent: 'center' }}>
                <PolygonButton
                  text="Update Profile"
                  width={180}
                  height={40}
                  onPress={handleUpdateProfile}
                  color="#C2000E"
                  textColor="#fff"
                  textStyle={{ fontSize: 22, fontWeight: 'bold' }}
                  style={{ marginTop: 20, alignSelf: 'center' }}
                />
              </div>
            ) : (
              <PolygonButton
                text="Update Profile"
                width={180}
                height={40}
                onPress={handleUpdateProfile}
                color="#C2000E"
                textColor="#fff"
                textStyle={{ fontSize: 22, fontWeight: 'bold' }}
                style={{ marginTop: 20, alignSelf: 'center' }}
              />
            )}

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