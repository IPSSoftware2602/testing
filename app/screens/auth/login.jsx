import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Polygon, Svg } from 'react-native-svg';
import GridBackground from '../../../components/slash/GridBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { textStyles } from '../../../styles/common';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';

const { width, height } = Dimensions.get('window');

export default function Login() {
  const [phone, setPhone] = useState('');
  const router = useRouter();
  const toast = useToast();
  // useEffect(() => {
  //   console.log(width);
  //   console.log(height);
  // }, [])

  const handleSendOTP = async (sendVia) => {
    if (phone) {
      try {
        const response = await axios.post(
          apiUrl + "send-otp",
          {
            phone_number: `+60${phone}`,
            send_via: sendVia
          }
        );
        const loginData = await response.data;
        // console.log(loginData);

        if (loginData.status === "success") {
          router.push({
            pathname: '/screens/auth/otp',
            params: {
              phone_number: phone,
              send_via: sendVia
            }
          });
        }

      } catch (err) {
        if (err.status === 404) {
          toast.show('Please try again later', {
            type: 'custom_toast',
            data: { title: 'Internal Server Error', status: 'danger' }
          });

          // Alert.alert('Internal Server Error', 'Please try again later');
        }
        else {
          console.log(err);
          toast.show(err.response.data.messages.error, {
            type: 'custom_toast',
            data: { title: 'Error', status: 'danger' }
          });
        }
      }
    }
    else {
      toast.show('Please try again later', {
        type: 'custom_toast',
        data: { title: 'Something Went Wrong', status: 'danger' }
      });
    }

  }
  return (
    // <View style={styles.outerWrapper}>
    //   <View style={commonStyles.contentWrapper}>
    // <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <ResponsiveBackground>
      <GridBackground
        backgroundColor="#C2000E"
        gridColor="#000"
        gridOpacity={0.25}
        gridSize={20}
      >

        <SafeAreaView style={styles.safeArea}>
          {/* Top Bar */}
          <TopNavigation title="USPIZZA" isBackButton={true} navigatePage={() => router.push('(tabs)')} />

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
                  Login / Sign Up by keying in your contact number!
                </Text>

                {/* Phone input */}
                <View style={styles.inputRow}>
                  <Text style={styles.countryCode}>+60</Text>
                  {Platform.OS === 'web' ? (
                    <div data-testid="phone-input" style={{ flex: 1 }}>
                      <TextInput
                        style={styles.input}
                        placeholder="123456789"
                        placeholderTextColor="#999"
                        keyboardType="phone-pad"
                        value={phone}
                    onChangeText={setPhone}
                      />
                    </div>
                  ) : (
                    <TextInput
                      style={styles.input}
                      placeholder="123456789"
                      placeholderTextColor="#999"
                      keyboardType="phone-pad"
                      value={phone}
                    onChangeText={setPhone}
                    />
                  )}
                </View>

                {/* SMS / WhatsApp buttons */}
                  <View style={styles.buttonRow}>
                    {Platform.OS === 'web' ? (
                      <div data-testid="sms-button" style={{ flex: 1 }}>
                        <TouchableOpacity
                          style={[styles.button, phone ? styles.smsButtonActive : styles.smsButton]}
                          onPress={() => handleSendOTP("sms")}
                          disabled={!phone}
                        >
                          <Ionicons
                            name="chatbubble-outline"
                            size={width >= 440 ? 20 : 18}
                            color="#fff"
                          />
                          <Text style={styles.buttonText}>SMS</Text>
                        </TouchableOpacity>
                      </div>
                    ) : (
                      <TouchableOpacity
                        testID="sms-button"
                        style={[styles.button, phone ? styles.smsButtonActive : styles.smsButton]}
                        onPress={() => handleSendOTP("sms")}
                        disabled={!phone}
                      >
                        <Ionicons
                          name="chatbubble-outline"
                          size={width >= 440 ? 20 : 18}
                          color="#fff"
                        />
                        <Text style={styles.buttonText}>SMS</Text>
                      </TouchableOpacity>
                    )}


                    <Text style={styles.orText}>OR</Text>

                    <TouchableOpacity
                      style={[styles.button, phone ? styles.whatsappButtonActive : styles.whatsappButton]}
                      onPress={() => handleSendOTP("whatsapp")}
                      disabled={!phone}
                    >
                      <FontAwesome5
                        name="whatsapp"
                        size={width >= 440 ? 20 : 18}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>WhatsApp</Text>
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
    </ResponsiveBackground>
    // </TouchableWithoutFeedback>
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
    top: width < 440 ? 34 : 12,
    left: 0,
    alignItems: 'center',
    transform: [{ translateY: '-22%' }],
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
    marginBottom: width < 440 ? 10 : 16,
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
    marginBottom: width <= 390 ? '3%' : width >= 440 ? 0.05 * 440 : "3%",
    width: width <= 375 ? '70%' : width > 440 ? 0.75 * 440 : "75%",
    letterSpacing: -0.3,
    lineHeight: 15,
  },

  // phone input row
  inputRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: width <= 390 ? '3%' : width >= 440 ? 0.05 * 440 : "3%",
    width: width <= 375 ? '70%' : width >= 440 ? 0.70 * 440 : "75%",
  },
  countryCode: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
    height: 45,
    fontFamily: 'RobotoSlab-Regular',
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    height: 45,
    fontFamily: 'RobotoSlab-Regular',
  },

  // SMS / WhatsApp buttons
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: width >= 440 ? 0.07 * 440 : width >= 375 ? "5%" : "8%",
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: width >= 440 ? 8 : 5,
    paddingHorizontal: 16,
    borderRadius: 8,
    width: width >= 440 ? 150 : 130,
  },
  smsButton: {
    backgroundColor: '#C86B6B',
  },
  smsButtonActive: {
    backgroundColor: '#C2000E',
  },
  whatsappButton: {
    backgroundColor: '#5ECB89',
  },
  whatsappButtonActive: {
    backgroundColor: '#25D366',
  },
  buttonText: {
    ...textStyles.buttonText,
    color: '#fff',
    paddingLeft: 10,
  }
}); 