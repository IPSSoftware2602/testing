import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Text, View, Dimensions, TextInput, Image, FlatList, TouchableOpacity, Alert } from 'react-native';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import TopNavigation from '../../../components/ui/TopNavigation';
import { fonts, colors } from '../../../styles/common';
import { FontAwesome6 } from '@expo/vector-icons';
import PolygonButton from '../../../components/ui/PolygonButton';
import * as Location from 'expo-location';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthGuard from '../../auth/check_token_expiry';
// import { useToast } from 'react-native-toast-notifications';
import { useToast } from '../../../hooks/useToast';

const { width, height } = Dimensions.get('window');

export default function OutletSelection() {
    useAuthGuard();
    const toast = useToast();
    // const [selectedOutlet, setSelectedOutlet] = useState("");
    const [serachOulet, setSearchedOutlet] = useState("");
    const router = useRouter();
    const [location, setLocation] = useState({ lat: null, lng: null });
    const [outletData, setOutletData] = useState([]);
    const [authToken, setAuthToken] = useState("");
    const [orderType, setOrderType] = useState("");


    const renderEmptyOutlet = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No outlets found.</Text>
            <Text style={styles.emptySubText}>Please pick other order methods.</Text>
        </View>
    );

    useEffect(() => {
        const getStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                setAuthToken(authToken);
                const orderType = await AsyncStorage.getItem('orderType');
                setOrderType(orderType);
                const deliveryAddressDetails = await AsyncStorage.getItem('deliveryAddressDetails');
                if (deliveryAddressDetails) {
                    const parseddeliveryAddressDetails = JSON.parse(deliveryAddressDetails);
                    setLocation({ lat: parseFloat(parseddeliveryAddressDetails.latitude), lng: parseFloat(parseddeliveryAddressDetails.longitude) });
                }

            } catch (err) {
                console.log(err);
            }
        };

        getStoredData();
        // console.log(lat, lng);
    }, [router])

    useEffect(() => {
        const fetchOutlet = async () => {
            try {
                let requestOrderType = orderType;
                if(!requestOrderType){
                    requestOrderType = await AsyncStorage.getItem('orderType');
                }
                const response = await axios.get(
                    `${apiUrl}outlets/nearest/${requestOrderType}/${location.lat}/${location.lng}`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}`,
                        },
                    });

                const outlet = await response.data;
                let outletData = outlet.result;

                // Sort outlets - open ones first, closed ones last
                outletData = outletData.sort((a, b) => {
                    const aStatus = getOutletStatus(a.operating_schedule || {});
                    const bStatus = getOutletStatus(b.operating_schedule || {});

                    const aIsOpen = aStatus.isOpen ?? false;
                    const bIsOpen = bStatus.isOpen ?? false;

                    // Open outlets come first (sort descending)
                    return bIsOpen - aIsOpen;
                });

                setOutletData(outletData);
            } catch (error) {
                console.error('Error fetching addresses:', error.message);
            }
        };

        if (authToken) {
            fetchOutlet();
        }
    }, [authToken, location]);


    const getCoordinates = async () => {
        try {
            // For Pickup and dinein (Location will be device location)
            // Ask for permission
            await Location.requestForegroundPermissionsAsync();
            // if (status !== 'granted') {
            //     toast.show('Please allow location access', {
            //         type: 'custom_toast',
            //         data: { title: 'Permission to access location was denied', status: 'danger' }
            //     });
            //     router.push('(tabs)')
            //     // setDefaultLocation();
            //     return;
            // }

            // Get current position
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation({ lat: currentLocation.coords.latitude, lng: currentLocation.coords.longitude });
            // console.log('Latitude:', currentLocation.coords.latitude);
            // console.log('Longitude:', currentLocation.coords.longitude);
        } catch (error) {
            console.error('Error getting location:', error);
            // Alert.alert('Error getting location');
            // setDefaultLocation();
        }
    };


    useEffect(() => {
        if (orderType && orderType !== "delivery") {
            getCoordinates();
        }
    }, [orderType]);

    const getOutletStatus = (operatingSchedule) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const todaySchedule = operatingSchedule[today];

        // If outlet is closed all day
        if (!todaySchedule?.is_operated) {
            return {
                isOpen: false,
                statusText: 'Closed today',
                operatingHours: ''
            };
        }

        const now = new Date();
        const currentHours = now.getHours();
        const currentMinutes = now.getMinutes();
        const currentTimeInMinutes = currentHours * 60 + currentMinutes;

        // Format operating hours for display
        const hoursRanges = todaySchedule.operating_hours.map(slot => {
            const [startHour, startMin] = slot.start_time.split(':').map(Number);
            const [endHour, endMin] = slot.end_time.split(':').map(Number);
            return `${formatTime(startHour, startMin)} - ${formatTime(endHour, endMin)}`;
        }).join(', ');

        // Check current status
        let isOpen = false;
        let statusText = '';

        for (const timeSlot of todaySchedule.operating_hours) {
            const [startHour, startMin] = timeSlot.start_time.split(':').map(Number);
            const [endHour, endMin] = timeSlot.end_time.split(':').map(Number);

            const startTimeInMinutes = startHour * 60 + startMin;
            const endTimeInMinutes = endHour * 60 + endMin;

            if (currentTimeInMinutes >= startTimeInMinutes &&
                currentTimeInMinutes < endTimeInMinutes) {
                isOpen = true;
                statusText = hoursRanges;
                break;
            }

            if (currentTimeInMinutes < startTimeInMinutes) {
                statusText = `Opens at ${formatTime(startHour, startMin)}`;
                break;
            }
        }

        // If past all time slots today
        if (!statusText) {
            const tomorrow = days[(now.getDay() + 1) % 7];
            const tomorrowSchedule = operatingSchedule[tomorrow];
            const nextOpenTime = tomorrowSchedule?.operating_hours?.[0]?.start_time;

            statusText = nextOpenTime
                ? `Opens ${tomorrow} at ${formatTime(...nextOpenTime.split(':').map(Number))}`
                : 'Closed';
        }

        return {
            isOpen,
            statusText,
            operatingHours: hoursRanges
        };
    };

    const setOutletDetials = async ({ outletId, distance, outletTitle, isOperate }) => {

        let outletData = {
            outletId,
            distanceFromUserLocation: distance,
            outletTitle,
            isOperate
        };
        try {
            await AsyncStorage.setItem('outletDetails', JSON.stringify(outletData));
            await AsyncStorage.removeItem('estimatedTime');
        }
        catch (err) {
            console.log(err.response.data.message);
        }
    }

    // Usage in OpeningStatus component:
    const OpeningStatus = ({ operatingSchedule }) => {
        const { isOpen, statusText, operatingHours } = getOutletStatus(operatingSchedule);

        return (
            <View style={styles.openingContainer}>
                <View style={[
                    styles.statusIndicator,
                    isOpen ? styles.openIndicator : styles.closedIndicator
                ]}>
                    <Text style={styles.statusText}>
                        {isOpen ? 'OPEN' : 'CLOSED'}
                    </Text>
                </View>
                <Text style={styles.timeText}>
                    {statusText || operatingHours}
                </Text>
            </View>
        );
    };

    // Helper to format time as "10:00 AM"
    const formatTime = (hours, minutes) => {
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    const renderOutlet = ({ item }) => (
        <>
            <TouchableOpacity
                onPress={() => {
                    setOutletDetials({ outletId: item.id, distance: item.distance_km, outletTitle: item.title, isOperate: getOutletStatus(item.operating_schedule).isOpen });
                    if(getOutletStatus(item.operating_schedule).isOpen){
                        router.push('(tabs)/menu')
                    }
                }}
                style={styles.card}>
                <View style={styles.outletNameContainer}>
                    <Text style={styles.name}>{item.title}</Text>
                    <FontAwesome6 name="chevron-right" style={styles.outletIcon} />
                </View>

                <View style={styles.openingHourContainer}>
                    <OpeningStatus operatingSchedule={item.operating_schedule} />
                </View>


                <View style={styles.outletInfoContainer}>

                    <View style={styles.addressDetails}>
                        <Text
                            style={styles.address}
                        >
                            {item.address}, {item.postal_code} {item.state}, {item.country}.
                        </Text>

                        <View style={styles.distanceDetails}>
                            <FontAwesome6 name="location-dot" style={styles.outletIcon} />
                            <Text style={styles.distance}>{item.distance_km ? `${item.distance_km} km` : ""}</Text>
                        </View>
                    </View>
                    <Image
                        source={
                            item.image && item.image.image_url
                                ? {
                                    uri: `${item.image.compressed_image_url || item.image.image_url
                                        }`,
                                }
                                : require("../../../assets/images/uspizza-icon.webp")
                        }
                        style={styles.image}
                        resizeMode="cover"
                    />
                </View>
                {getOutletStatus(item.operating_schedule).isOpen ? 
                    <View style={styles.btnContainer}>
                        <PolygonButton
                            text="Select"
                            width={Math.min(width, 440) * 0.28}
                            height={30}
                            color="#C2000E"
                            textColor="#fff"
                            textStyle={{ fontWeight: 'bold', fontSize: 20, fontFamily: 'Route159-HeavyItalic' }}
                            onPress={() => {
                                // setSelectedOutlet(item.id);
                                setOutletDetials({ outletId: item.id, distance: item.distance_km, outletTitle: item.title, isOperate: getOutletStatus(item.operating_schedule).isOpen });
                                if(getOutletStatus(item.operating_schedule).isOpen){
                                    router.push('(tabs)/menu')
                                }
                            }}
                        />
                    </View>
                    :null}

            </TouchableOpacity>
        </>
    )

    const filteredOutlets = outletData.filter(outlet => {
        if (!serachOulet) return true; // Show all when search is empty
        return outlet.title.toLowerCase().includes(serachOulet.toLowerCase());
    });

    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF2E2' }}>
                <TopNavigation title="Select Outlet Location" isBackButton={true} navigatePage={() => router.push('(tabs)')} />
                <View style={styles.searchBar}>
                    <FontAwesome6 name="magnifying-glass" style={styles.searchIcon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Enter outlet name"
                        placeholderTextColor="#999"
                        value={serachOulet}
                        onChangeText={setSearchedOutlet}
                        autoCorrect={false}
                        autoCapitalize="none"
                    />
                </View>

                <FlatList
                    // ref={outletListRef}
                    data={filteredOutlets}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.outletList}
                    renderItem={renderOutlet}
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={renderEmptyOutlet}
                />
            </SafeAreaView>
        </ResponsiveBackground>
    )
}

const styles = StyleSheet.create({
    input: {
        flex: 1,
        fontSize: 16,
        color: '#222',
        fontFamily: 'Route159-Regular',
        padding: 15,
        // width: '80%',
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.background,
        borderRadius: 8,
        marginHorizontal: 16,
        marginBottom: 20,
        paddingHorizontal: 16,
        height: 50,
        marginTop: height * 0.02,
    },
    searchIcon: {
        fontSize: 18,
        color: '#bbb',
        marginRight: 8,
    },
    outletList: {
        maxWidth: width <= 360 ? 320 : width <= 440 ? 400 : 440,
        backgroundColor: '#FFF2E2',
        marginHorizontal: 18,
        alignSelf: 'center',
        marginVertical: 5,
    },
    outletIcon: {
        fontSize: 15,
        color: '#C2000E',
        // marginLeft: width * 0.01,
        alignSelf: 'center',
        alignContent: 'flex-end'
    },
    addressDetails: {
        display: 'flex',
        flexDirection: 'column',
        width: '65%',
        justifyContent: 'space-between',
        // height: '100%'
    },
    distanceDetails: {
        display: 'flex',
        flexDirection: 'row',
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
    image: {
        width: '30%',
        height: 'auto',
        alignSelf: 'center',
        aspectRatio: 1,
        // alignItems: 'center',
    },
    outletNameContainer: {
        paddingHorizontal: 12,
        paddingTop: '5%',
        paddingBottom: '3%',
        display: 'flex',
        flexDirection: 'row',
        width: '95%',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'center'
    },
    outletInfoContainer: {
        paddingHorizontal: 14,
        display: 'flex',
        flexDirection: 'row',
        width: '90%',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'center',
        alignContent: 'center',
        backgroundColor: 'rgba(255, 242, 226, 0.3)',
    },
    statusContainer: {
        paddingHorizontal: 12,
        paddingBottom: '4%',
        display: 'flex',
        flexDirection: 'row',
        width: '95%',
        alignItems: 'flex-start',
        alignSelf: 'center'
    },
    btnContainer: {
        paddingHorizontal: 12,
        paddingTop: '3%',
        paddingBottom: '5%',
        display: 'flex',
        flexDirection: 'row',
        width: '95%',
        alignItems: 'center',
        justifyContent: 'flex-end',
        alignSelf: 'center'
    },
    name: {
        fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 16 : 14) : 14) : 18,
        fontWeight: 'bold',
        color: '#C2000E',
        fontFamily: 'Route159-Bold',
    },
    address: {
        paddingVertical: '5%',
        fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 12) : 12) : 16,
        color: '#555',
        width: '100%',
        textAlign: 'left',
        textTransform: 'uppercase',
        fontFamily: 'Route159-Regular',
    },
    distance: {
        fontSize: 15,
        color: '#555',
        width: '100%',
        paddingVertical: '5%',
        marginLeft: '3%',
        fontFamily: 'Route159-Regular',
    },
    openingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    statusIndicator: {
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    openIndicator: {
        backgroundColor: '#4CAF50', // Green for open
    },
    closedIndicator: {
        backgroundColor: '#F44336', // Red for closed
    },
    statusText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        fontFamily: 'Route159-Bold',
    },
    timeText: {
        fontSize: 13,
        color: '#555',
        fontFamily: 'Route159-Regular',
    },
    openingHourContainer: {
        paddingHorizontal: 12,
        // paddingTop: '5%',
        paddingBottom: '3%',
        display: 'flex',
        flexDirection: 'row',
        width: '95%',
        alignItems: 'center',
        justifyContent: 'space-between',
        alignSelf: 'center'
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