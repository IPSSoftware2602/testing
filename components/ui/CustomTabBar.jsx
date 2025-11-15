import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { CustomTabBarBackground } from "./CustomTabBarBackground";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { SafeAreaView } from 'react-native-safe-area-context';
import LoginRequiredModal from './LoginRequiredModal';

import AsyncStorage from '@react-native-async-storage/async-storage';

const dineInIcon = require("../../assets/elements/home/home_dinein.png");
const pickUpIcon = require("../../assets/elements/home/home_pickup.png");
const deliverIcon = require("../../assets/elements/home/home_delivery.png");

const { width, height } = Dimensions.get("window");



const TAB_ICONS = [
  {
    name: "home",
    label: "Home",
    icon: require("../../assets/elements/tabbar/menu_home.png"),
  },
  {
    name: "pizza",
    label: "Menu",
    icon: require("../../assets/elements/tabbar/menu_pizza.png"),
  },
  {
    name: "market",
    label: "Market",
    icon: require("../../assets/elements/tabbar/menu_market.png"),
  },
  {
    name: "order",
    label: "Order",
    icon: require("../../assets/elements/tabbar/menu_order.png"),
  },
  {
    name: "profile",
    label: "Profiles",
    icon: require("../../assets/elements/tabbar/menu_profile.png"),
  },
];
export function CustomTabBar({ state, descriptors, navigation }) {
  const [orderTypeModalVisible, setOrderTypeModalVisible] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (orderTypeModalVisible) {
      Alert.alert('Modal Debug', `Height: ${Dimensions.get('window').height}`);
    }
  }, [orderTypeModalVisible]);

  const handleTabPress = async (route, index) => {
    // Market tab (index 2) and Order tab (index 3) require login
    if (index === 3) {
      const authToken = await AsyncStorage.getItem('authToken');
      const customerData = await AsyncStorage.getItem('customerData');
      
      if (!authToken || !customerData) {
        setShowLoginModal(true);
        return;
      }
    }

    if (index === 1) {
      const orderType = await AsyncStorage.getItem('orderType');
      if (orderType === 'dinein' || orderType === 'pickup' || orderType === 'delivery') {
        router.push({
          pathname: route.name
        });
      } else {
        // Navigate to home tab with modal parameter
        router.push({
          pathname: '(tabs)',
          params: { showModal: 'true' },
        });
      }
    } else {
      navigation.navigate(route.name);
    }
  };

  const handleLoginModalConfirm = () => {
    setShowLoginModal(false);
    router.push('/screens/auth/login');
  };

  const handleSetOrderType = async (orderType) => {
    try {
      await AsyncStorage.setItem('orderType', orderType);
    }
    catch (err) {
      console.log(err.response.data.message);
    }
  }

  const handleOrderTypeSelect = (type) => {
    setOrderTypeModalVisible(false);
    handleSetOrderType(type);
    if (type === "delivery") {
      router.push("/screens/home/address_select");
    } else {
      router.push("/screens/home/outlet_select");
    }
  };

  return (
    <>
      <View style={styles.wrapper}>
        <CustomTabBarBackground />
        <View style={styles.row}>
          <View style={styles.rowWrapper}>
            {state.routes.map((route, index) => {
              const { options } = descriptors[route.key];
              const isFocused = state.index === index;
              const tab = TAB_ICONS[index];

              if (!tab) return null;

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  onPress={() => handleTabPress(route, index)}
                  style={styles.tab}
                  activeOpacity={0.8}
                >
                  <View style={styles.iconLabel}>
                    <Image
                      source={tab.icon}
                      style={{
                        marginBottom: 10,
                        width: 60,
                        height: 40,
                        transform: isFocused ? [{ scale: 1.1 }] : [],
                      }}
                    />
                    <Text
                      style={[styles.label, isFocused && styles.labelActive]}
                    >
                      {tab.label}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>

      <Modal
        transparent
        visible={orderTypeModalVisible}
        // animationType="fade"
        onRequestClose={() => setOrderTypeModalVisible(false)}
        statusBarTranslucent={true} // Important for Android
        hardwareAccelerated={true}
        supportedOrientations={['portrait', 'landscape']}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>

              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setOrderTypeModalVisible(false)}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                How would you like to{"\n"}get your order?
              </Text>

              {/* Dine In */}
              <TouchableOpacity
                style={[styles.modalCard, { marginTop: 0 }]}
                onPress={() => handleOrderTypeSelect("dinein")}
                activeOpacity={0.8}
              >
                <View style={styles.modalCardLeft}>
                  <Image source={dineInIcon} style={styles.modalCardIcon} />
                </View>
                <View style={styles.modalCardRight}>
                  <Text style={styles.modalCardText}>DINE IN</Text>
                </View>
              </TouchableOpacity>

              {/* Self Pickup */}
              <TouchableOpacity
                style={styles.modalCard}
                onPress={() => handleOrderTypeSelect("pickup")}
                activeOpacity={0.8}
              >
                <View style={styles.modalCardLeft}>
                  <Image source={pickUpIcon} style={styles.modalCardIcon} />
                </View>
                <View style={styles.modalCardRight}>
                  <Text style={styles.modalCardText}>SELF PICKUP</Text>
                </View>
              </TouchableOpacity>

              {/* Delivery */}
              <TouchableOpacity
                style={styles.modalCard}
                onPress={() => handleOrderTypeSelect("delivery")}
                activeOpacity={0.8}
              >
                <View style={styles.modalCardLeft}>
                  <Image source={deliverIcon} style={styles.modalCardIcon} />
                </View>
                <View style={styles.modalCardRight}>
                  <Text style={styles.modalCardText}>DELIVERY</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>

      <LoginRequiredModal
        isVisible={showLoginModal}
        onConfirm={handleLoginModalConfirm}
        onCancel={() => setShowLoginModal(false)}
      />
    </>
  );
}

const TAB_COUNT = 5;
const styles = StyleSheet.create({
  modalRootContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999, // Extremely high z-index
  },
  modalOuterContainer: {
    width: Math.min(440, width),
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    // alignSelf: 'center',
    padding: 20,
    position: 'absolute',
  },
  modalInnerContainer: {
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 0,
    width: Math.min(width * 0.85, 360),
    // maxWidth: '90%',
    alignItems: 'center',
    ...Platform.select({
      android: {
        elevation: 24, // High elevation for Android
      },
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingVertical: 32,
    paddingHorizontal: 0,
    width: Math.min(width * 0.85, 360),
    maxWidth: "90%",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 3,
    right: 16,
    zIndex: 2,
    padding: 4,
  },
  closeButtonText: {
    fontSize: 26,
    color: "#999",
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: 20,
    marginBottom: 30,
    textAlign: "center",
    color: "#C2000E",
    fontFamily: "Route159-HeavyItalic",
  },
  modalCard: {
    flexDirection: "row",
    backgroundColor: "#e3e3e3",
    borderRadius: 14,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 18,
    width: 280,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginTop: 20,
  },
  modalCardLeft: {
    marginRight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCardIcon: {
    width: 58,
    height: 58,
    resizeMode: "contain",
  },
  modalCardRight: {
    flex: 1,
    justifyContent: "center",
  },
  modalCardText: {
    fontSize: 22,
    color: "#C2000E",
    fontWeight: "bold",
    letterSpacing: 1.2,
    fontFamily: "Route159-HeavyItalic",
  },
  wrapper: {
    position: "absolute",
    bottom: Platform.OS === 'android' ? 40 : 15, // Extra bottom margin for Android
    width: "100%",
    maxWidth: 440,
    height: 64,
    backgroundColor: "transparent",
    alignSelf: "center",
  },
  row: {
    width: "100%",
    maxWidth: 440,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 1,
  },
  rowWrapper: {
    flex: 1,
    width: "90%",
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 60,
  },
  iconLabel: {
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#FDEFE3",
    fontFamily: "Route159-Heavy",
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 15 : 14) : 14) : 18,
  },
  labelActive: {
    color: "#FFFFFF",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 2,
    fontWeight: "700",
    transform: [{ scale: 1.15 }],
  },
});

const modalCard = {
  flexDirection: "row",
  backgroundColor: "#e3e3e3",
  borderRadius: 14,
  alignItems: "center",
  paddingVertical: 24,
  paddingHorizontal: 18,
  width: 280,
  shadowColor: "#000",
  shadowOpacity: 0.07,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
const modalCardLeft = {
  marginRight: 20,
  alignItems: "center",
  justifyContent: "center",
};
const modalCardIcon = {
  width: 58,
  height: 58,
  resizeMode: "contain",
};
const modalCardRight = {
  flex: 1,
  justifyContent: "center",
};
const modalCardText = {
  fontSize: 22,
  color: "#C2000E",
  fontWeight: "bold",
  letterSpacing: 1.2,
  fontFamily: "Route159-HeavyItalic",
};