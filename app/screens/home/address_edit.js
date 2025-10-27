import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, TextInput, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { commonStyles, colors } from '../../../styles/common';
// import { FontAwesome6 } from '@expo/vector-icons';
import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
// import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';
import ReadOnlyDeliveryMapWeb from '../../../components/order/ReadOnlyDeliveryMap';
import ReadOnlyDeliveryMapNative from '../../../components/order/ReadOnlyDeliveryMap';
import { CustomCheckbox } from '../../../components/ui/CustomCheckBox';
import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');

export default function DeliveryAddressEdit() {
    useAuthGuard();
    const router = useRouter();
    // const params = useLocalSearchParams();
    const { addressId, origin } = useLocalSearchParams();
    const [addressData, setAddressData] = useState({
        id: "",
        customer_id: "",
        name: "",
        phone: "",
        address: "",
        unit: "",
        note: "",
        is_default: "",
        longitude: "101.6869",
        latitude: "3.139",
    });
    const [authToken, setAuthToken] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [location, setLocation] = useState({
        longitude: "101.6869",
        latitude: "3.139"
    })
    const [isWeb, setIsWeb] = useState(Platform.OS === 'web');
    const memoizedLocation = React.useMemo(() => ({
        latitude: parseFloat(location.latitude),
        longitude: parseFloat(location.longitude),
    }), [location.latitude, location.longitude]);

    useEffect(() => {
        const getToken = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');

                setAuthToken(authToken);
                // setCustomerData(customerData);
            } catch (err) {
                console.log(err);
            }
        };

        getToken();
    }, [router])

    useEffect(() => {
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
                const addressData = address.data;
                setIsDefault(addressData.is_default === "1");
                setAddressData((prev) => ({
                    ...prev,
                    ...addressData
                }));
                setLocation(
                    {
                        longitude: addressData.longitude,
                        latitude: addressData.latitude
                    }
                )
            } catch (error) {
                console.error('Error fetching addresses:', error);
            }
        };

        if (authToken && addressId) {
            fetchAddress();
        }
    }, [addressId, authToken]);

    const handleInputChange = (field, value) => {
        setAddressData((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    useEffect(() => {
        console.log(addressData);

        // console.log({ latitude: parseFloat(addressData.latitude), longitude: parseFloat(addressData.longitude) })
    }, [addressData]);


    const handleUpdateAddress = () => {
        console.log("Update address");
        const updateLocation = async () => {
            try {
                const response = await axios.post(
                    `${apiUrl}customer/address/update/${addressId}`,
                    {
                        address: addressData.address,
                        latitude: addressData.latitude,
                        longitude: addressData.longitude,
                        unit: addressData.unit,
                        note: addressData.note,
                        name: addressData.name,
                        phone: addressData.phone,
                        is_default: isDefault === true ? "1" : "0"
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    }
                );
                const responseData = response.data;
                if (responseData.status === "success" && isDefault) {
                    await axios.post(
                        `${apiUrl}customer/address/default/${addressData.id}`,
                        {
                            customer_id: addressData.customer_id
                        },
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${authToken}`,
                            },
                        }
                    );
                }

                setTimeout(() => {
                    if (origin === "profile") {
                        router.replace("/screens/profile/addresses");
                    }
                    else {
                        router.replace("/screens/home/address_select")
                    }

                }, 200);

            } catch (err) {
                console.log(err);
            }
        }

        updateLocation();
    }

    const handleNavigateBack = () => {
    if (origin === "profile") {
        router.replace("/screens/profile/addresses");
    } else {
        router.replace("/screens/home/address_select");
    }
    };

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
                <TopNavigation title="Edit Delivery Address" isBackButton={true} navigatePage={handleNavigateBack} />
                <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>

                    <Text style={styles.pageTitle}>Address Information</Text>

                    {isWeb ? (<View>
                        <ReadOnlyDeliveryMapWeb
                            location={memoizedLocation}
                            address="123 Jalan Bukit, Kuala Lumpur"
                            styles={styles.location}
                            addressId={addressId}
                        />
                    </View>) : (
                        <View>
                            <ReadOnlyDeliveryMapNative
                                location={memoizedLocation}
                                address="123 Jalan Bukit, Kuala Lumpur"
                                styles={styles.location}
                                addressId={addressId}
                            />
                        </View>)}

                    <View style={styles.formWrapper}>
                        <View style={styles.form}>

                            <View style={styles.checkboxContainer}>
                                <CustomCheckbox
                                    checked={isDefault}
                                    onPress={() => setIsDefault(!isDefault)}
                                    color="#C2000E"
                                />
                                <Text style={styles.checkboxText}>Set as default</Text>
                            </View>

                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Name</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Name"
                                placeholderTextColor="#999"
                                value={addressData.name}
                                onChangeText={(value) => handleInputChange("name", value)}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Phone Number</Text>
                            {/* <TextInput
                                style={commonStyles.input}
                                placeholder="Phone Number (e.g. 0123456789)"
                                placeholderTextColor="#999"
                                value={addressData.phone}
                                onChangeText={(value) => handleInputChange("phone", value)}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            /> */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                <Text
                                    style={[commonStyles.input, { flex: 1, textAlignVertical: 'center', textAlign: 'center' }]}
                                >
                                    +60
                                </Text>
                                <TextInput
                                    style={[commonStyles.input, { flex: 9 }]}
                                    placeholder="Phone Number (e.g. 0123456789)"
                                    placeholderTextColor="#999"
                                    value={addressData.phone}
                                    onChangeText={(value) => handleInputChange("phone", value)}
                                    keyboardType="number-pad"
                                    autoCapitalize="none"
                                    maxLength={10}
                                />
                            </View>
                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Unit</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Unit"
                                placeholderTextColor="#999"
                                value={addressData.unit}
                                onChangeText={(value) => handleInputChange("unit", value)}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Address</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Address"
                                placeholderTextColor="#999"
                                value={addressData.address}
                                onChangeText={(value) => handleInputChange("address", value)}
                                multiline={true}
                                numberOfLines={3}
                            />
                            <Text style={styles.formTitle}>Add Notes (Optional)</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Notes"
                                placeholderTextColor="#999"
                                value={addressData.note}
                                onChangeText={(value) => handleInputChange("note", value)}
                                multiline={true}
                                numberOfLines={4}
                            />

                        </View>
                    </View>
                    <View style={styles.editBtn}>
                        <CustomPolygonButton
                            width={Math.min(width, 440) * 0.7}
                            label="Update Address"
                            onPress={handleUpdateAddress}
                        ></CustomPolygonButton>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ResponsiveBackground>
    )
}

const styles = StyleSheet.create({
    formWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    formTitle: {
        fontSize: 15,
        fontFamily: 'Route159-SemiBold',
        color: '#333333',
        marginBottom: '2%',
        textAlign: 'flex-start',
        // width: '80%',
    },
    form: {
        width: '100%',
        paddingHorizontal: '8%',
        marginVertical: '3%',
    },
    location: {
        width: Math.min(width, 440) * 0.85,
        backgroundColor: '#FFF',
        height: height * 0.25,
        borderRadius: 10,
        // marginHorizontal: 16,
        alignSelf: 'center',
        // marginVertical: 5,
    },
    pageTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#222',
        marginTop: "6%",
        marginLeft: '8%',
        marginBottom: '2%',
        fontFamily: 'Route159-Bold',
    },
    editBtn: {
        marginVertical: '5%',
    },
    checkboxContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginBottom: '2%',
        alignItems: 'center'
    },
    checkboxText: {
        color: colors.textLight,
        fontSize: 14,
        fontFamily: 'Route159-Regular',
    },

});