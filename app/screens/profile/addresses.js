import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, Dimensions, FlatList, TouchableOpacity, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { colors, commonStyles } from '../../../styles/common';
import { FontAwesome6 } from '@expo/vector-icons';
import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
import { CustomTabBarBackground } from '../../../components/ui/CustomTabBarBackground';
import useAuthGuard from '../../auth/check_token_expiry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';
import ConfirmationModal from '../../../components/ui/ConfirmationModal';

const { width, height } = Dimensions.get('window');

export default function Addresses() {
    useAuthGuard();
    const [selectedAddress, setSelectedAddress] = useState("");
    const router = useRouter();
    const [addresses, setAddresses] = useState([]);
    const [authToken, setAuthToken] = useState("");
    const [customerData, setCustomerData] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteAddressId, setDeleteAddressId] = useState(null);

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

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await axios.get(
                    `${apiUrl}customers/address/${customerData.id}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });

                const addressData = await response.data;
                // Sort addresses - default first
                const sortedAddresses = addressData.data.sort((a, b) => {
                    return b.is_default.localeCompare(a.is_default);
                });

                // console.log("Sorted Addresses:", sortedAddresses);
                setAddresses(sortedAddresses);
            } catch (error) {
                console.error('Error fetching addresses:', error);
            }
        };

        if (authToken && customerData) {
            fetchAddresses();
        }
    }, [authToken, customerData]);


    const handleAddAddress = () => {
        router.push({ pathname: '/screens/home/address_add', params: { origin: 'profile' } });
    }

    const handleDelete = (addressId) => {
        if (Platform.OS === 'web') {
            setDeleteAddressId(addressId);
            setShowDeleteModal(true);
        }
        else {
            Alert.alert(
                'Delete Confirmation',
                'Are you sure you want to delete this address?',
                [
                    {
                        text: 'Cancel',
                        style: 'cancel',
                    },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: () => confirmDelete(addressId),
                    },
                ],
                { cancelable: true }
            );
        }
    }

    const confirmDelete = async (addressId) => {
        try {
            const response = await axios.post(
                `${apiUrl}customer/address/delete/${addressId}`, null,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`,
                    },
                }
            );
            const data = await response.data;
            if (data.status === 'success') {
                // console.log("Successful");
                setDeleteAddressId(null);
                setTimeout(() => {
                    router.replace('screens/home/address_select');
                }, 200);
            }

        }
        catch (err) {
            console.log(err);
        }
    }

    const renderAddress = ({ item }) => (
        <>

            <View style={styles.addressCard}>

                <View style={styles.addressContainer}>

                    {/* Address info */}
                    <View style={styles.addressDetailsContainer}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.address}>{item.unit ? `${item.unit}, ${item.address}` : item.address}</Text>
                        {item.is_default === "1" && (
                            <Text style={styles.defaultBadge}>DEFAULT</Text>
                        )}
                    </View>

                    {/* Edit & Delete buttons */}
                    <View style={styles.buttonRow}>
                    {/* ✏️ Edit Button */}
                    {Platform.OS === 'web' ? (
                        <div data-testid="edit-address-button" style={{ display: 'flex' }}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() =>
                            router.push({
                                pathname: '/screens/home/address_edit',
                                params: { addressId: item.id, origin: 'profile' },
                            })
                            }
                        >
                            <FontAwesome6 name="pen-to-square" size={18} color="#666" />
                        </TouchableOpacity>
                        </div>
                    ) : (
                        <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() =>
                            router.push({
                            pathname: '/screens/home/address_edit',
                            params: { addressId: item.id, origin: 'profile' },
                            })
                        }
                        >
                        <FontAwesome6 name="pen-to-square" size={18} color="#666" />
                        </TouchableOpacity>
                    )}

                    {/* 🗑️ Delete Button */}
                    {Platform.OS === 'web' ? (
                        <div data-testid="delete-address-button" style={{ display: 'flex' }}>
                        <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleDelete(item.id)}
                        >
                            <FontAwesome6 name="trash-can" size={18} color="#666" />
                        </TouchableOpacity>
                        </div>
                    ) : (
                        <TouchableOpacity
                        style={styles.iconButton}
                        onPress={() => handleDelete(item.id)}
                        >
                        <FontAwesome6 name="trash-can" size={18} color="#666" />
                        </TouchableOpacity>
                    )}
                    </View>
                </View>
            </View>

        </>
    )

    const renderEmptyAddresses = () => (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No saved addresses found.</Text>
                <Text style={styles.emptySubText}>Please add a delivery address to continue.</Text>
            </View>
        );

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FEF2E2' }}>
                <TopNavigation title="Addresses" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
                <Text style={styles.title}>Saved Addresses</Text>
                {/* <ScrollView contentContainerStyle={[commonStyles.containerStyle]}> */}

                <View style={{ flex: 1 }}>
                    {/* <View style={{ height: height * 0.86 - 120 }}> */}
                    <FlatList
                        // ref={outletListRef}
                        data={addresses}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.addressList}
                        renderItem={renderAddress}
                        ListEmptyComponent={renderEmptyAddresses}
                        showsVerticalScrollIndicator={false}
                    />
                </View>
                {/* */}

                {/* </ScrollView> */}

                <View style={styles.bottomBar}>
                    <TouchableOpacity
                        style={{
                            width: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        onPress={handleAddAddress}
                    >
                        <CustomTabBarBackground
                            width={Math.min(width, 440) * 0.7}
                        />
                        <Text style={styles.bottombtnText}>Add New Address</Text>
                    </TouchableOpacity>
                </View>

                {/* <View style={{ position: 'absolute', bottom: 10, width: '100%' }}>
                    <View style={styles.addBtn}>
                        <CustomPolygonButton
                            width={Math.min(width, 440) * 0.7}
                            label="Add New Address"
                            onPress={handleAddAddress}
                        ></CustomPolygonButton>
                    </View>
                </View> */}

                <ConfirmationModal
                    title={"Delete Confirmation"}
                    subtitle={"Are you sure you want to delete this address?"}
                    confirmationText={"Delete"}
                    onConfirm={() => {
                        setShowDeleteModal(false);
                        confirmDelete(deleteAddressId);
                    }}
                    onCancel={() => setShowDeleteModal(false)}
                    isVisible={showDeleteModal}
                />


            </SafeAreaView>
        </ResponsiveBackground>
    )
}

const styles = StyleSheet.create({
    bottomBar: {
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 20,
        backgroundColor: '#FEF2E2',
        borderTopWidth: 1,
        borderTopColor: '#eee',
        // marginBottom: '3%'
    },
    bottombtnText: {
        fontFamily: 'Route159-Heavy',
        fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 18 : 18) : 18) : 20,
        color: '#fff',
        marginBottom: 20,
    },
    addressList: {
        width: Math.min(width, 440) * 0.9,
        backgroundColor: 'transparent',
        // padding: 5,
        marginHorizontal: 16,
        alignSelf: 'flex-start',
        marginVertical: '1%',
        // flexGrow: 1,
        paddingVertical: '2%',
        borderRadius: 10,
        justifyContent: 'flex-start',
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
        justifyContent: 'flex-start',
        width: '95%',
        // flex: 1,
        // paddingHorizontal: '3%',
        alignSelf: 'flex-start',
        alignContent: 'center',
        // marginHorizontal: '3%',
    },
    addressCard: {
        paddingVertical: '3%',
        paddingHorizontal: '4%',
        marginHorizontal: "3%",
        backgroundColor: 'white',
        display: 'flex',
        flexDirection: 'column',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderRadius: 10,
        marginBottom: '3%',
    },
    checkboxContainer: {
        alignSelf: 'flex-start',
        // marginLeft: '2%'
        // zIndex: 1,
    },
    addressDetailsContainer: {
        // marginRight: 40,
        width: width < 450 ? '70%' : '75%',
        // marginHorizontal: '5%',
        marginLeft: '3%',
        marginRight: '10%'
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
    name: {
        fontSize: 15,
        // fontWeight: 900,
        color: '#C2000E',
        marginBottom: 4,
        fontFamily: 'Route159-SemiBold',
    },
    address: {
        fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 13 : 13) : 13) : 14,
        color: '#666',
        marginBottom: 8,
        fontFamily: 'Route159-Regular',
        textAlign: 'flex-start'
    },
    buttonRow: {
        flexDirection: 'row',
        gap: Platform.OS === 'web' ? 18 : 15,
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
        marginVertical: Platform.OS === 'web' ? '8%' : '9%',
    },
    selectedAddressCard: {
        borderWidth: 1,
        borderColor: '#C2000E',
        shadowColor: '#C2000E',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    defaultBadge: {
        fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 12) : 14) : 14,
        color: '#C2000E',
        fontWeight: 'bold',
        marginBottom: 4,
        fontFamily: 'Route159-Bold',
        borderWidth: 1,
        borderColor: '#C2000E',
        borderRadius: 3,
        paddingHorizontal: 4,
        alignSelf: 'flex-start',
        includeFontPadding: false, // Removes extra font padding (Android)
        textAlignVertical: 'center'
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        fontFamily: 'Route159-Bold',
        color: '#C2000E',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubText: {
        fontSize: 14,
        fontFamily: 'Route159-Regular',
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },

});