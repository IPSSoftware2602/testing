import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View, Dimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Polygon, Svg } from 'react-native-svg';
import GridBackground from '../../../components/slash/GridBackground';
import OTPInput from '../../../components/ui/OTPInput.jsx';
import TopNavigation from '../../../components/ui/TopNavigation';
import { textStyles } from '../../../styles/common';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';

const { width, height } = Dimensions.get('window');

export default function OTP() {
  const [otp, setOtp] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const router = useRouter();
  const { phone_number, send_via } = useLocalSearchParams();
  const toast = useToast();

  const handleOTPComplete = async (completedOTP) => {
    try {
      const response = await axios.post(
        apiUrl + "verify-api",
        {
          phone_number: `+60${phone_number}`,
          otp: completedOTP
        }
      );
      const otpData = await response.data;
      // console.log(otpData);
      if (otpData.status === "success") {
        try {
          await AsyncStorage.setItem('authToken', otpData.token);
          const jsonCustomerData = JSON.stringify(otpData.data);
          await AsyncStorage.setItem('customerData', jsonCustomerData);
          const verifyType = otpData.verify_type;
          // console.log(verifyType);

          toast.show('Welcome to US Pizza!', {
            type: 'custom_toast',
            data: { title: 'Successfully Login', status: 'success' }
          });
          if (verifyType === "register") {
            router.push('/screens/auth/register');
          } else {
            router.push('(tabs)');
          }
          // setTimeout(() => {
          //   if (verifyType === "register") {
          //     router.push('/screens/auth/register');
          //   } else {
          //     router.push('(tabs)');
          //   }
          // }, 1000);

        } catch (err) {
          console.log(err);
        }
      }


    } catch (err) {
      const newRetryCount = retryCount + 1;
      setRetryCount(newRetryCount);
      setOtp('');

      if (err.response && err.response.status === 401) {
        if (newRetryCount >= 3) {
          // Alert.alert('Incorrect OTP', 'You’ve exceeded the maximum number of attempts.');
          toast.show('You’ve exceeded the maximum number of attempts.', {
            type: 'custom_toast',
            data: { title: 'Incorrect OTP', status: 'danger' }
          });
          setTimeout(() => {
            router.push('/screens/auth/login');
          }, 2000);

        } else {
          toast.show(`Incorrect OTP. You have ${3 - newRetryCount} attempt(s) left.`, {
            type: 'custom_toast',
            data: { title: 'Incorrect OTP', status: 'danger' }
          });
          // Alert.alert('Incorrect OTP', `Incorrect OTP. You have ${3 - newRetryCount} attempt(s) left.`);
        }
      } else {
        // alert('Something went wrong. Please try again.');
        toast.show('Something went wrong. Please try again.', {
          type: 'custom_toast',
          data: { title: 'Unexpected Error', status: 'danger' }
        });
        console.error(err);
      }
    }
  };

  const handleResendOTP = async () => {
    try {
      const response = await axios.post(
        apiUrl + "send-otp",
        {
          phone_number: '+60' + phone_number,
          send_via: send_via
        }
      );

      // Alert.alert('OTP Resent', 'Kindly check your inbox');
      toast.show('Kindly check your inbox', {
        type: 'custom_toast',
        data: { title: 'OTP Resent', status: 'success' }
      });

    } catch (err) {
      console.log(err);
    }
  }

  return (
    <ResponsiveBackground>
      {/* <View style={styles.outerWrapper}>
      <View style={commonStyles.contentWrapper}> */}
      <GridBackground
        backgroundColor="#C2000E"
        gridColor="#000"
        gridOpacity={0.25}
        gridSize={20}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <TopNavigation title="USPIZZA" isBackButton={true} navigatePage={() => router.push('/screens/auth/login')} />

          {/* Main Content */}
          <View style={styles.mainContent}>
            <View style={styles.panelWrapper}>
              {/* 3D hexagon background */}
              <Svg
                viewBox="0 0 440 500"
                // width={400}
                width="100%"
                height={500}
                preserveAspectRatio="xMidYMid meet"
                aspectRatio={440 / 500}
                style={styles.hexagonBg}
              >
                {/* front face */}
                <Polygon
                  points="70,0 370,0 430,200 360,270 40,270 10,200"
                  fill="#FCEEDB"
                />
                {/* bottom extruded face */}
                <Polygon
                  points="10,200 430,200 405,280 35,280"
                  fill="#E6D3B3"
                />
              </Svg>

              {/* your actual content on top */}
              <View style={styles.panelContent}>
                {/* Logo circle */}
                <View style={styles.logoCircle}>
                  <Image
                    source={require('../../../assets/logo.png')}
                    style={styles.logoImage}
                  />
                </View>

                {/* Title & subtitle */}
                <Text style={styles.title}>US Pizza Malaysia Official</Text>
                <Text style={styles.subtitle}>
                  Your one-time password (OTP) has been sent to +60{phone_number}
                </Text>

                {/* OTP Input */}
                <View style={styles.otpContainer}>
                  <OTPInput
                    length={6}
                    value={otp}
                    onChange={setOtp}
                    onComplete={handleOTPComplete}
                    style={styles.otpInput}
                  />
                </View>

                {/* Resend OTP */}
                <View style={styles.resendContainer}>
                  <Text style={styles.resendText}>Didn&apos;t receive the code? </Text>
                  <TouchableOpacity onPress={() => {
                    handleResendOTP();
                  }}>
                    <Text style={styles.resendLink}>Resend</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Food Icons Row */}
            <View style={styles.foodIconsRow}>
              <Image source={require('../../../assets/icons/pizza-slice.png')} style={styles.foodIcon} />
              <Image source={require('../../../assets/icons/fries.png')} style={styles.foodIcon} />
              <Image source={require('../../../assets/icons/burger.png')} style={styles.foodIcon} />
              <Image source={require('../../../assets/icons/noodle.png')} style={styles.foodIcon} />
              <Image source={require('../../../assets/icons/drink.png')} style={styles.foodIcon} />
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Image source={require('../../../assets/icons/est1997.png')} style={styles.est1997Icon} />
            <Text style={styles.footerText}>{`Only at US pizza where the pizza\nalways served Fresh`}</Text>
          </View>
        </SafeAreaView>
      </GridBackground>
      {/* </View>
    </View > */}
    </ResponsiveBackground>
  );
}

const styles = StyleSheet.create({
  defaultFont: {
    fontFamily: 'RobotoSlab-Regular',
  },
  outerWrapper: {
    flex: 1,
    backgroundColor: width > 440 && Platform.OS === 'web' ? '#FFF6ED' : '#C2000E',
  },
  contentWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: Math.min(width, 440),
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
    width: Math.min(width, 440),
    alignSelf: 'center',
  },
  topBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 2,
  },
  topBarText: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 24,
    letterSpacing: 1,
    fontFamily: 'RobotoSlab-Bold',
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#FFF4E1',
    borderRadius: 16,
    alignItems: 'center',
    padding: 24,
    width: '90%',
    maxWidth: 400,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 12,
  },
  smsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E60012',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flex: 1,
    marginRight: 8,
  },
  smsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
  },
  orText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
    marginHorizontal: 10,
    fontFamily: 'RobotoSlab-Bold',
  },
  waBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25D366',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    flex: 1,
    marginLeft: 8,
  },
  waBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'RobotoSlab-Bold',
  },
  foodIconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  foodIcon: {
    marginHorizontal: 4,
    width: 40,
    height: 40,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  est1997Icon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
    marginBottom: 4,
  },
  footerText: {
    color: '#fff',
    fontSize: 15,
    textAlign: 'center',
    fontFamily: 'RobotoSlab-Bold',
    lineHeight: 16
  },
  panelWrapper: {
    width: width,
    height: width >= 440 ? 874 * 0.36 : (height < 830 ? 830 * 0.36 : height * 0.36), //874 is optimum height for mobile
    // aspectRatio: 440 / 500,
    alignSelf: 'center',
    marginTop: 24,
  },
  hexagonBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    flex: 1,
  },
  panelContent: {
    position: 'absolute',
    width: width,
    top: width < 440 ? 39 : 20,
    left: 0,
    alignItems: 'center',
    transform: [{ translateY: '-25%' }],
  },

  // logo circle
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderColor: '#C2000E',
    borderWidth: 3,
    backgroundColor: '#FCEEDB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: width < 440 ? 10 : 15,
  },
  logoImage: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },

  // title & subtitle
  title: {
    ...textStyles.title,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 22,
    fontSize: width <= 375 ? 18 : 20,
  },
  subtitle: {
    ...textStyles.subtitle,
    color: '#666',
    textAlign: 'center',
    marginBottom: width > 440 ? 0.05 * 440 : "4%",
    width: width <= 375 ? '70%' : width > 440 ? 0.75 * 440 : "75%",
    letterSpacing: -0.3,
    lineHeight: 15,
    fontSize: width <= 375 ? 12 : 13,
  },

  // OTP container
  otpContainer: {
    // marginBottom: width < 390 ? '3%' : "5%",
    marginBottom: width <= 390 ? '3%' : width >= 440 ? 0.05 * 440 : "4%",
  },
  otpInput: {
    width: '80%',
    height: width < 390 ? 38 : 40,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: width <= 375 ? 18 : 20,
    fontFamily: 'RobotoSlab-Regular'
  },

  // resend container
  resendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: width < 390 ? '11%' : width >= 440 ? 0.07 * 440 : "5%",
  },
  resendText: {
    color: '#666',
    fontSize: width <= 375 ? 14 : 16,
    fontFamily: 'RobotoSlab-Regular',
  },
  resendLink: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: width <= 375 ? 15 : 17,
    marginLeft: 4,
    fontFamily: 'RobotoSlab-Bold',
  },
}); 