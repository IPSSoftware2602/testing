import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
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
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';
import { CustomCheckbox } from '../../../components/ui/CustomCheckBox';
import useAuthGuard from '../../auth/check_token_expiry';

const { width, height } = Dimensions.get('window');

export default function DeliveryAddressAddDetails() {
    useAuthGuard();
    const router = useRouter();
    const { address, longitude, latitude } = useLocalSearchParams();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const memoizedLocation = React.useMemo(() => ({
        latitude: lat,
        longitude: lng,
    }), [lat, lng]);

    const [authToken, setAuthToken] = useState("");
    const [customerData, setCustomerData] = useState(null);
    const [currentAddress, setCurrentAddress] = useState(address);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [unit, setUnit] = useState("");
    const [notes, setNotes] = useState("");
    // const [isDefault, setIsDefault] = useState(false);
    const [isWeb, setIsWeb] = useState(Platform.OS === 'web');

    const toast = useToast();

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                const customerJson = await AsyncStorage.getItem('customerData');
                const customerData = customerJson ? JSON.parse(customerJson) : null;

                setAuthToken(authToken);
                setCustomerData(customerData);
            } catch (err) {
                console.log(err);
                router.push('/screens/auth/login');
            }
        };

        checkStoredData();
    }, [router])

    const handleCreateAddress = () => {

        // console.log(isDefault);
        const createAddress = async () => {

            if (!address || !name || !phone || !unit) {
                toast.show('Address, Name, Unit and Phone are required!', {
                    type: 'custom_toast',
                    data: { title: 'Missing Input(s)', status: 'danger' }
                });
                return;
            }

            try {
                const response = await axios.post(
                    `${apiUrl}customer/address/create`,
                    {
                        address: currentAddress,
                        name: name,
                        phone: phone,
                        unit: unit || "",
                        note: notes || "",
                        latitude: latitude,
                        longitude: longitude,
                        customer_id: customerData.id,
                        // is_default: isDefault === true ? "1" : "0"
                    },
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });

                const addressData = await response.data;

                if (addressData.status === 'success') {
                    console.log(addressData);
                    setTimeout(() => {
                        router.replace('/screens/home/address_select');
                        handleClear();
                    }, 200);
                }
            } catch (error) {
                console.error('Error creating addresses:', error);
            }
        };

        createAddress();
    }

    const handleClear = () => {
        setCurrentAddress("");
        setName("");
        setPhone("");
        setUnit("");
        setNotes("");
    }

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
                <TopNavigation title="Delivery Address Details" isBackButton={true} navigatePage={() => router.push('/screens/home/address_add')} />
                <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>

                    <Text style={styles.pageTitle}>Address Information</Text>

                    {isWeb ? (<View>
                        <ReadOnlyDeliveryMapWeb
                            location={memoizedLocation}
                            address="123 Jalan Bukit, Kuala Lumpur"
                            styles={styles.location}
                            isEdit={false}
                        />
                    </View>) : (
                        <View>
                            <ReadOnlyDeliveryMapNative
                                location={memoizedLocation}
                                address="123 Jalan Bukit, Kuala Lumpur"
                                styles={styles.location}
                                isEdit={false}
                            />
                        </View>)}



                    <View style={styles.formWrapper}>
                        <View style={styles.form}>
                            {/* <View style={styles.checkboxContainer}>
                                <CustomCheckbox
                                    checked={isDefault}
                                    onPress={() => setIsDefault(!isDefault)}
                                    color="#C2000E"
                                />
                                <Text style={styles.checkboxText}>Set as default</Text>
                            </View> */}

                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Name</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Name"
                                placeholderTextColor="#999"
                                value={name}
                                onChangeText={setName}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Phone Number</Text>
                            {/* <TextInput
                                style={commonStyles.input}
                                placeholder="Phone Number  (e.g. 0123456789)"
                                placeholderTextColor="#999"
                                value={phone}
                                onChangeText={setPhone}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                                 maxLength={10} 
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
                                    value={phone}
                                    onChangeText={setPhone}
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
                                value={unit}
                                onChangeText={setUnit}
                                // keyboardType="email-address"
                                autoCapitalize="none"
                            />
                            <Text style={styles.formTitle}><Text style={{ color: '#C2000E' }}>* </Text>Address</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Address"
                                placeholderTextColor="#999"
                                value={currentAddress}
                                onChangeText={setCurrentAddress}
                                multiline={true}
                                numberOfLines={3}
                            />
                            <Text style={styles.formTitle}>Add Notes (Optional)</Text>
                            <TextInput
                                style={commonStyles.input}
                                placeholder="Notes"
                                placeholderTextColor="#999"
                                value={notes}
                                onChangeText={setNotes}
                                multiline={true}
                                numberOfLines={4}
                            />

                        </View>
                    </View>
                    <View style={styles.editBtn}>
                        <CustomPolygonButton
                            width={Math.min(width, 440) * 0.7}
                            label="Add Address"
                            onPress={handleCreateAddress}
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