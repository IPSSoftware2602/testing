import React, { use, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View, Dimensions, ActivityIndicator } from 'react-native';
import TopNavigation from '../../../components/ui/TopNavigation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { commonStyles, fonts } from '../../../styles/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import { LinearGradient } from 'expo-linear-gradient';
import { CustomPolygonButton } from '../../../components/ui/CustomPolygonButton';
import { apiUrl } from '../../constant/constants';
import axios from 'axios';  // Make sure axios is installed and imported
import useAuthGuard from '../../auth/check_token_expiry';

const { width } = Dimensions.get('window');

export default function StudentCard() {
    useAuthGuard();
    const router = useRouter();

    // State to hold student card status: null = loading, false = no record, string = status
    const [studentCardStatus, setStudentCardStatus] = useState(null);
    const [customerData, setCustomerData] = useState(null);
    const [authToken, setAuthToken] = useState("");
    const dynamicFontSize =
        width <= 440
            ? width <= 375
                ? width <= 360
                    ? 14
                    : 12
                : 14
            : 14;

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                const authToken = await AsyncStorage.getItem('authToken');
                const customerJson = await AsyncStorage.getItem('customerData');
                const customerData = customerJson ? JSON.parse(customerJson) : null;

                // if (!customerData) {
                //     router.push('/screens/auth/login');
                // }
                setAuthToken(authToken);
                setCustomerData(customerData);
            } catch (err) {
                console.log(err);
                // router.push('/screens/auth/login');
            }
        };

        checkStoredData();
    }, [router])

    useEffect(() => {
        // Fetch student card status on mount
        const fetchStatus = async () => {
            console.log(customerData);
            try {
                const response = await axios.get(
                    apiUrl + `customer/student-card-status/` + customerData.id,
                    {
                        headers: {
                            Authorization: `Bearer ${authToken}`,  // add Bearer token here
                        },
                    }
                );
                if (response.data.status === 'success' && response.data.data) {
                    setStudentCardStatus(response.data.data.status); // e.g. "pending"
                } else {
                    // no record or some error in data
                    setStudentCardStatus(false);
                }
            } catch (error) {
                if (error.response && error.response.status === 404) {
                    // No record found
                    setStudentCardStatus(false);
                } else {
                    // Other errors, you may want to handle it differently
                    console.error('Failed to fetch student card status', error);
                    setStudentCardStatus(false);
                }
            }
        };

        fetchStatus();

    }, [customerData, authToken]);

    // Show loading spinner while fetching
    if (studentCardStatus === null) {
        return (
            <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#C2000E" />
            </SafeAreaView>
        );
    }

    let buttonLabel = 'Activate your student card';
    let isActivated = false;

    if (studentCardStatus) {
        const status = studentCardStatus.toLowerCase();

        if (status === 'pending') {
            buttonLabel = 'Student Card Being Reviewed';
            isActivated = true;
        } else if (status === 'approved') {
            buttonLabel = 'Student Card has been Approved';
            isActivated = true;
        } else if (status === 'rejected') {
            buttonLabel = 'Student Card has been Rejected\n(Send Again)';
            isActivated = false;  // allow clicking if rejected
        }
    }
    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
                <TopNavigation title="STUDENT CARD" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
                <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>
                    <View style={styles.studentCardWrapper}>
                        <LinearGradient
                            colors={['#E60012', '#FFF2E2']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            locations={[0, 0.2]}
                            style={styles.studentCard}
                        >
                            <View style={styles.studentCardContainer}>
                                <Image
                                    source={require('../../../assets/elements/profile/studentCard/uspizza-studentcard.png')}
                                    style={styles.image}
                                />
                                <Text style={styles.title}>Present your student card to enjoy discounts</Text>
                            </View>
                        </LinearGradient>

                        <View style={styles.callToAction}>
                            <Text style={styles.callToActionTitle}>First Time Activation</Text>
                            {/* <TouchableOpacity> */}
                            <View style={styles.callToActionContainer}>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Buy one get one free pizza</Text>
                                    <Text style={styles.sectionDescription}>The coupon is valid for 7 natural days from the day of receipt</Text>
                                </View>
                                <Image
                                    source={require('../../../assets/elements/profile/studentCard/uspizza-pizza.png')}
                                    style={styles.pizzaImage}
                                />
                            </View>
                            {/* </TouchableOpacity> */}
                        </View>
                        <View style={styles.callToAction} >
                            <Text style={styles.callToActionTitle}>Weekly Privileges</Text>
                            {/* <TouchableOpacity> */}
                            <View style={styles.callToActionContainer}>

                                <View style={styles.section}>
                                    <Text style={styles.sectionTitle}>Buy one get one free pizza</Text>
                                    <Text style={styles.sectionDescription}>The coupon is valid for 7 natural days from the day of receipt</Text>
                                </View>
                                <Image
                                    source={require('../../../assets/elements/profile/studentCard/uspizza-pizza.png')}
                                    style={styles.pizzaImage}
                                />
                            </View>
                            {/* </TouchableOpacity> */}
                        </View>
                        <View style={styles.wrapper} >
                            <CustomPolygonButton
                                width={Math.min(width, 440) * 0.68}
                                label={buttonLabel}
                                disabled={isActivated}
                                onPress={() => {
                                    if (!isActivated) {
                                        router.push('/screens/profile/student-card-activation');
                                    }
                                }}
                                labelStyle={{
                                    fontSize: dynamicFontSize,
                                    fontFamily: fonts.bold,
                                    color: '#fff',
                                    textAlign: 'center',
                                }}
                            />
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </ResponsiveBackground >
    );
}

const styles = StyleSheet.create({

    wrapper: {
        position: "relative",
        marginTop: '10%',
        width: "100%",
        maxWidth: 440,
        alignSelf: "center",
    },
    studentCard: {
        padding: 16,
        width: Math.min(width, 440),
        alignItems: 'center'
    },
    studentCardContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginVertical: '5%'
    },
    studentCardWrapper: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    image: {
        height: Math.min(width, 440) * 0.45 * 946 / 936,
        aspectRatio: 936 / 946,
        width: Math.min(width, 440) * 0.45,
        marginTop: '5%',
        marginBottom: '3%',
        resizeMode: 'contain',
    },
    pizzaImage: {
        height: Math.min(width, 440) * 0.4 * 560 / 932,
        aspectRatio: 932 / 560,
        width: Math.min(width, 440) * 0.4,
        // marginTop: '5%',
        // marginBottom: '3%',
        resizeMode: 'contain',
        // position: 'absolute',
        // left: '62%',
        // top: '50%',
        alignSelf: 'center',
        // transform: [{ translateY: -(Math.min(width, 440) * 0.3) / 2 }],
    },
    title: {
        fontSize: 22,
        fontFamily: fonts.bold,
        color: '#C2000E',
        textAlign: 'center',
        width: Math.min(440, width) * 0.7,
    },
    callToAction: {
        marginTop: '5%'
    },
    callToActionContainer: {
        backgroundColor: '#C2000E',
        borderRadius: 10,
        marginHorizontal: 16,
        paddingLeft: '1%',
        paddingVertical: '3%',
        flexDirection: 'row',
        width: Math.min(440, width) * 0.8,
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        position: 'relative'
    },
    callToActionTitle: {
        fontSize: 18,
        fontFamily: fonts.default,
        color: '#333333',
        marginBottom: '2%',
        textAlign: 'center',
        // width: '80%',
    },
    section: {
        borderRadius: 10,
        marginLeft: '4%',
        // paddingLeft: '3%',
        // paddingVertical: '8%',
        flexDirection: 'column',
        width: '58%',
        alignItems: 'flex-start',
        alignSelf: 'center',
        // marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: '#FFF',
        marginBottom: '2%',
    },
    sectionDescription: {
        fontSize: 10,
        fontFamily: fonts.regular,
        color: '#FFF',
    },
}); 