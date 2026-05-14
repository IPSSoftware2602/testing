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
import CountryCodePicker from '../../../components/ui/CountryCodePicker';
import { dialDigits, findCountryByDial } from '../../../constants/countries';
import { isValidPhoneNumber, parsePhoneNumberFromString } from 'libphonenumber-js';

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
    const [countryCode, setCountryCode] = useState("+60");
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

            // Validate phone against the SELECTED country's format (CR-003 baseline).
            // CR-012: also normalize via parsePhoneNumberFromString so the saved
            // value is always canonical E.164 regardless of what the user typed.
            // Prevents the doubled-prefix corruption case (user types "60125854587"
            // with the +60 picker selected → naive concat would save "6060125854587").
            const country = findCountryByDial(countryCode);
            const parsedPhone = country ? parsePhoneNumberFromString(phone, country.code) : null;
            if (!country || !parsedPhone || !parsedPhone.isValid()) {
                toast.show(`Phone number is not valid for ${country?.name || 'the selected country'}.`, {
                    type: 'custom_toast',
                    data: { title: 'Invalid phone', status: 'danger' }
                });
                return;
            }
            // E.164 string ("+60125854587") → strip "+" for the address payload format.
            const canonicalPhone = parsedPhone.number.replace(/^\+/, '');

            try {
                const response = await axios.post(
                    `${apiUrl}customer/address/create`,
                    {
                        address: currentAddress,
                        name: name,
                        phone: canonicalPhone,
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
        setCountryCode("+60");
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
                            <View style={styles.phoneRow}>
                                <CountryCodePicker
                                    value={countryCode}
                                    onChange={setCountryCode}
                                    triggerStyle={styles.countryCodeButton}
                                    textStyle={styles.countryCodeButtonText}
                                />
                                <TextInput
                                    style={styles.phoneInput}
                                    placeholder="Phone Number (e.g. 0123456789)"
                                    placeholderTextColor="#999"
                                    value={phone}
                                    onChangeText={setPhone}
                                    keyboardType="number-pad"
                                    autoCapitalize="none"
                                    maxLength={15}
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
                                style={[commonStyles.input, { maxHeight: 80 }]}
                                placeholder="Address"
                                placeholderTextColor="#999"
                                value={currentAddress}
                                onChangeText={setCurrentAddress}
                                multiline={true}
                                numberOfLines={3}
                                scrollEnabled={true}
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
    // CR-011: phone row layout — country picker + phone input on one line, both
    // visually matching the rest of the form's input style. Uses `alignItems: stretch`
    // so the picker and input always share the same height even if RN's intrinsic
    // measurement disagrees, and gives the picker a fixed minWidth so the dial
    // codes ("+852", "+673") don't squash the phone field.
    phoneRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        marginBottom: 15,
        gap: 8,
    },
    countryCodeButton: {
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        minWidth: 92,
    },
    countryCodeButtonText: {
        fontSize: 14,
        color: '#333333',
        fontWeight: '500',
    },
    phoneInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#DDDDDD',
        borderRadius: 8,
        paddingHorizontal: 15,
        fontSize: 12,
        fontFamily: 'RobotoSlab-Regular',
        color: '#333333',
    },
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
        fontFamily: 'Route159-Regular',
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