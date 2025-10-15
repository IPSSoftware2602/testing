import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { colors } from '../../../styles/common';
import { FontAwesome6 } from '@expo/vector-icons';
// import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import EditableDeliveryMapWeb from '../../../components/order/EditableDeliveryMap';
import EditableDeliveryMapNative from '../../../components/order/EditableDeliveryMap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';
import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');

export default function DeliveryAddressEditDetails() {
    useAuthGuard();
    const router = useRouter();
    const [initialLocation, setInitialLocation] = useState({
        latitude: 3.139,
        longitude: 101.6869,
    });
    const [addressData, setAddressData] = useState({
        customer_id: "",
        name: "",
        phone: "",
        address: "",
        unit: "",
        note: "",
        is_default: "",
        longitude: "",
        latitude: "",
    });
    const { lat, lng, addressId } = useLocalSearchParams();
    const [currentAddress, setCurrentAddress] = useState("");
    const [longitude, setLongitude] = useState("");
    const [latitude, setLatitude] = useState("");
    const [locationLoaded, setLocationLoaded] = useState(false);
    const [isWeb, setIsWeb] = useState(Platform.OS === 'web');
    const [authToken, setAuthToken] = useState("");

    useEffect(() => {
        const getToken = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                setAuthToken(authToken);
            } catch (err) {
                console.log(err);
            }
        };
        getToken();
    }, [router])

    useEffect(() => {
        // console.log(addressId);
        const fetchAddress = async () => {
            try {
                const response = await axios.get(
                    `${apiUrl}customer/address/detail/${addressId}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });

                const address = await response.data;
                // console.log("Fetched Addresses:", addressData.data);
                const addressData = address.data;
                setAddressData(addressData);
            } catch (error) {
                console.error('Error fetching addresses:', error);
            }
        };

        if (authToken && addressId) {
            fetchAddress();
        }
    }, [addressId, authToken]);

    useEffect(() => {
        if (lat && lng) {
            const latValue = parseFloat(lat);
            const lngValue = parseFloat(lng);
            setInitialLocation({
                latitude: latValue,
                longitude: lngValue
            })
            setLongitude(latValue);
            setLatitude(lngValue);
            setLocationLoaded(true);
        }
    }, [lat, lng])

    const handleEditAddress = () => {
        const updateLocation = async () => {
            try {
                const response = await axios.post(
                    `${apiUrl}customer/address/update/${addressId}`,
                    {
                        address: currentAddress,
                        latitude: latitude,
                        longitude: longitude,
                        unit: addressData.unit,
                        note: addressData.note,
                        name: addressData.name,
                        phone: addressData.phone,
                        is_default: addressData.is_default
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    }
                );
                const responseData = response.data;
                if (responseData.status === "success") {
                    setTimeout(() => {
                        router.replace({
                            pathname: "/screens/home/address_edit",
                            params: {
                                addressId: addressId
                            }
                        })
                    }, 500);
                }
            } catch (err) {
                console.log(err);
            }
        }

        updateLocation();
    }

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
                <TopNavigation title="Edit Delivery Address" isBackButton={true} navigatePage={() => router.push('/screens/home/address_edit')} />

                {isWeb ? (
                    <View >
                        {locationLoaded ? (
                            <EditableDeliveryMapWeb
                                initialLatLng={initialLocation}
                                onLocationChange={(locationData) => {
                                    // console.log("Location changed:", locationData);
                                    setCurrentAddress(locationData.address);
                                    setLongitude(locationData.longitude);
                                    setLatitude(locationData.latitude);
                                }}
                                autoComplete={true}
                                styles={styles.mapContainer}
                            />
                        ) : (
                            <View style={[styles.mapContainer, {
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#FFF'
                            }]}>
                                <Text style={styles.locationText}>Loading your location...</Text>
                            </View>
                        )}
                        {/* </View> */}
                    </View>
                ) : (
                    <View >
                        {locationLoaded ? (
                            <EditableDeliveryMapNative
                                initialLatLng={initialLocation}
                                onLocationChange={(locationData) => {
                                    // console.log("Location changed:", locationData);
                                    setCurrentAddress(locationData.address);
                                    setLongitude(locationData.longitude);
                                    setLatitude(locationData.latitude);
                                }}
                                styles={styles.mapContainer}
                                autoComplete={true}
                            />
                        ) : (
                            <View style={[styles.mapContainer, {
                                justifyContent: 'center',
                                alignItems: 'center',
                                backgroundColor: '#FFF'
                            }]}>
                                <Text style={styles.locationText}>Loading your location...</Text>
                            </View>

                        )}
                    </View>
                )}

                <View style={styles.locationContainer}>
                    <View style={styles.iconContainer}>
                        <FontAwesome6
                            name={"location-dot"}
                            size={30}
                            color={'#C2000E'}
                            solid
                        />
                    </View>
                    <Text style={styles.locationText}>{currentAddress || "Location not specified"}</Text>
                </View>

                {/* <View style={{ position: 'absolute', bottom: height * 0.05, width: '100%' }}>
                    <View style={styles.addBtn}>
                        <CustomPolygonButton
                            width={Math.min(width, 440) * 0.7}
                            label="Update Address"
                            onPress={handleEditAddress}
                        ></CustomPolygonButton>
                    </View>
                </View> */}

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={handleEditAddress}
                    >
                        <CustomTabBarBackground
                            width={Math.min(width, 440) * 0.7}
                        />
                        <Text style={styles.bottombtnText}>Update Address</Text>
                    </TouchableOpacity>
                </View>
                {/* </ScrollView> */}
            </SafeAreaView>
        </ResponsiveBackground >
    )
}

const styles = StyleSheet.create({
    bottomBar: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#FEF2E2',
        // borderTopWidth: 1,
        // borderTopColor: '#eee',
    },
    bottombtnText: {
        fontFamily: 'Route159-Heavy',
        fontSize: 20,
        color: '#fff',
        marginBottom: 20,
    },
    addressList: {
        width: Math.min(width, 440) * 0.9,
        backgroundColor: '#FFF2E2',
        // padding: 5,
        marginHorizontal: 16,
        alignSelf: 'center',
        marginVertical: 5,
    },
    mapContainer: {
        width: Math.min(width, 440),
        height: height * 0.55,
        backgroundColor: 'transparent',
        alignItems: 'center',
        // marginVertical: '1%'
    },
    iconContainer: {
        width: '20%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    locationContainer: {
        width: Math.min(width, 440) * 0.9,
        height: height * 0.15,
        backgroundColor: '#FFF',
        borderRadius: 10,
        alignSelf: 'center',
        marginVertical: '5%',
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center',
        // justifyContent: 'center',
        alignItems: 'center',
        paddingRight: '2%',
    },
    card: {
        backgroundColor: colors.background,
        borderRadius: 12,
        marginBottom: height <= 750 ? height * 0.04 : height * 0.02,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        // borderColor: '#C2000E',
        // borderWidth: 1,
    },
    addressContainer: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '95%',
        // flex: 1,
        paddingHorizontal: '2%',
        alignSelf: 'flex-start',
        alignContent: 'center',
    },
    addressCard: {
        paddingVertical: '3%',
        marginHorizontal: "3%",
        backgroundColor: 'transparent',
        display: 'flex',
        flexDirection: 'column',
    },
    checkboxContainer: {
        alignSelf: 'flex-start',
        // zIndex: 1,
    },
    addressDetailsContainer: {
        // marginRight: 40,
        width: '75%',
        marginHorizontal: '3%'
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginTop: "6%",
        marginLeft: '8%',
        marginBottom: '2%',
        fontFamily: 'Route159-Bold',
    },
    residenceName: {
        fontSize: 15,
        // fontWeight: 900,
        color: '#C2000E',
        marginBottom: 4,
        fontFamily: 'Route159-SemiBold',
    },
    address: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
        fontFamily: 'Route159-Regular',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 20,
    },
    iconButton: {
        padding: '2%'
    },
    horizontalLine: {
        height: 1,
        backgroundColor: '#C2000E',
        marginTop: 16,
    },
    addBtn: {
        // marginVertical: '5%',
        // position: 'static',
    },
    locationText: {
        fontSize: width < 440 ? 14 : 16,
        color: '#222',
        fontFamily: 'RobotoSlab-Regular',
        width: '75%',
        // marginRight: "3%"
    },

});