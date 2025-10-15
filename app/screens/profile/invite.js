import { Image, ScrollView, StyleSheet, Text, View, Dimensions, Linking, Platform, Modal, TouchableOpacity, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import TopNavigation from '../../../components/ui/TopNavigation';
import { useRouter } from 'expo-router';
import { commonStyles, fonts } from '../../../styles/common';
import ResponsiveBackground from '../../../components/ResponsiveBackground';
import PolygonButton from '../../../components/ui/PolygonButton';
import { FontAwesome6 } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useAuthGuard from '../../auth/check_token_expiry';
import axios from 'axios';
import { apiUrl } from '../../constant/constants';

const { width, height } = Dimensions.get('window');
const invitation = [
    {
        name: "Steven Chong",
        status: "pending"
    },
    {
        name: "Muhammad Ali",
        status: "accepted"
    },
    {
        name: "Lim Ah Kau",
        status: "accepted"
    },
    {
        name: "John Paul",
        status: "rejected"
    },
    {
        name: "+60123456789",
        status: "accepted"
    },
    {
        name: "+60123445138",
        status: "rejected"
    },
];

export default function Invite() {
    useAuthGuard();
    const router = useRouter();
    // const [authToken, setAuthToken] = useState("");
    const [customerData, setCustomerData] = useState(null);
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [invitationList, setInvitationList] = useState([]);

    useEffect(() => {
        const checkStoredData = async () => {
            try {
                // const authToken = await AsyncStorage.getItem('authToken');
                const customerJson = await AsyncStorage.getItem('customerData');
                const customerData = customerJson ? JSON.parse(customerJson) : null;

                if (!customerData) {
                    router.push('/screens/auth/login');
                }
                // setAuthToken(authToken);
                setCustomerData(customerData);
            } catch (err) {
                console.log(err);
                router.push('/screens/auth/login');
            }
        };

        checkStoredData();
    }, [router])

    const sendReferral = async () => {
        console.log(customerData);
        if (!customerData) return;
      
        const message = `Join US Pizza and get rewards! Register with my referral link: https://uspizza.ipsgroup.com.my/screens/splash?referral_id=${customerData.customer_referral_code}`;
        const encodedMessage = encodeURIComponent(message);
        const waDeepLink = `whatsapp://send?text=${encodedMessage}`;
        const waBusinessDeepLink = `whatsapp-business://send?text=${encodedMessage}`;
        const url = `https://wa.me/?text=${encodedMessage}`;
      
        if (Platform.OS === "web") {
          // ✅ Web → WhatsApp Web chooser
          window.open(url, "_blank");
          return;
        }
      
        try {
          if (Platform.OS === "ios") {
            // ✅ iOS → Use native Share sheet (will show WhatsApp as an option)
            await Share.share({
              message,
            });
          } else {
            // ✅ Android → Prefer deep link so WhatsApp Business opens compose window
            const canOpenWaBusiness = await Linking.canOpenURL(waBusinessDeepLink);
            if (canOpenWaBusiness) {
              await Linking.openURL(waBusinessDeepLink);
              return;
            }

            const canOpenWa = await Linking.canOpenURL(waDeepLink);
            if (canOpenWa) {
              await Linking.openURL(waDeepLink);
              return;
            }

            const supported = await Linking.canOpenURL(url);
            if (supported) {
              await Linking.openURL(url);
              return;
            }

            // Fallback to SMS if WhatsApp missing
            // await Linking.openURL(`sms:?body=${encodedMessage}`);
          }
        } catch (error) {
          console.log("Error sharing referral:", error);
          // Last fallback for both iOS & Android
          await Share.share({
            message,
          });
        }
    };

    useEffect(() => {
        const fetchInvitations = async () => {
            const token = await AsyncStorage.getItem('authToken') || '';
            try {
                const response = await axios.get(`${apiUrl}referral/list/${customerData?.id}`, {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (response.data.status === 200) {
                    setInvitationList(response.data.data);
                }

            } catch (err) {
                console.log(err);
            }
        };
        if (customerData?.id) {
            fetchInvitations();
        }
    }, [customerData?.id])


    return (
        <ResponsiveBackground>
            <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF2E2' }}>
                <TopNavigation title="INVITE" isBackButton={true} navigatePage={() => router.push('(tabs)/profile')} />
                <ScrollView contentContainerStyle={[commonStyles.containerStyle]} showsVerticalScrollIndicator={false}>
                    <Image
                        // source={{ uri: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500' }}
                        source={require('../../../assets/elements/profile/invite/uspizza-invite.png')}
                        style={styles.image}
                        contentFit="cover"
                    // resizeMode="contain"
                    />
                    <View style={styles.inviteContainer}>
                        <Text style={styles.invitationTitle}>Invite friends to place orders for prizes</Text>
                        <View style={styles.invitationCard}>
                            <Text style={styles.invitationDescription}>For every friend invited to place an order, register, and consume, the following rewards can be obtained</Text>
                            {/* <TouchableOpacity > */}
                            <View style={styles.inviteSection}>
                                <Text style={styles.inviteSectionTitle}>Buy one get one free pizza</Text>
                                <Text style={styles.inviteSectionDescription}>This coupon is valid for 7 natural days from the day of receipt</Text>
                            </View>
                            {/* </TouchableOpacity> */}
                        </View>

                        <PolygonButton
                            text="INVITE NOW"
                            width={Math.min(width, 440) * 0.45}
                            height={40}
                            style={styles.inviteBtn}
                            textStyle={styles.inviteText}
                            onPress={() => setInviteModalVisible(true)}
                        />
                        <View style={styles.invitationListCard}>
                            <Text style={styles.invitationListTitle}>My Invitation List</Text>
                            <View style={styles.horizontalLine} />

                            {invitationList.length > 0 ? invitationList.map((item, index) => (
                                <View key={index} style={styles.inviteList}>
                                    <Text style={styles.inviteListTitle}>
                                        {item.name}
                                    </Text>
                                    <Text style={styles.inviteListStatus}>
                                        {item.created_at ? item.created_at.split(' ')[0] : ''}
                                    </Text>
                                    {/* <Text style={{ ...styles.inviteListStatus, color: item.status === 'accepted' ? '#00C851' : (item.status === 'pending' ? '#FBD04A' : '#FF3333') }}>
                                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                        <FontAwesome6
                                            name={
                                                item.status === 'accepted'
                                                    ? 'circle-check'
                                                    : item.status === 'pending'
                                                        ? 'clock'
                                                        : 'circle-xmark'
                                            }
                                            size={18}
                                            color={
                                                item.status === 'accepted'
                                                    ? '#00C851'
                                                    : item.status === 'pending'
                                                        ? '#FBD04A'
                                                        : '#FF3333'
                                            }
                                            style={{
                                                marginLeft: '2%',
                                            }}
                                            solid
                                        />
                                    </Text> */}
                                </View>
                            )) : <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>No Invitations Found</Text>
                                <Text style={styles.emptySubText}>Please invite your friends to get started.</Text>
                            </View>}

                        </View>

                    </View>


                </ScrollView>

                <Modal
                    transparent
                    visible={inviteModalVisible}
                    animationType="fade"
                    onRequestClose={() => setInviteModalVisible(false)}
                >
                    <View style={{
                        flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)'
                    }}>
                        <View style={{
                            backgroundColor: '#fff',
                            borderRadius: 18,
                            paddingVertical: 32,
                            paddingHorizontal: 0,
                            width: Math.min(width * 0.85, 360),
                            alignItems: 'center',
                        }}>
                            <TouchableOpacity
                                style={{
                                    position: "absolute",
                                    top: 3,
                                    right: 16,
                                    zIndex: 2,
                                    padding: 4,
                                }}
                                onPress={() => setInviteModalVisible(false)}
                                activeOpacity={0.7}
                            >
                                <Text style={{ fontSize: 26, color: "#999", fontWeight: "bold" }}>
                                    ×
                                </Text>
                            </TouchableOpacity>
                            <Text style={{
                                fontWeight: 'bold',
                                fontSize: 20,
                                marginBottom: 30,
                                textAlign: 'center',
                                color: '#C2000E',
                                fontFamily: 'Route159-HeavyItalic',
                            }}>
                                Refer your friend to{'\n'}get rewards?
                            </Text>

                            {/* --- Google Map --- */}
                            <TouchableOpacity
                                style={styles.modalCard}
                                onPress={() => sendReferral()}
                                activeOpacity={0.8}
                            >
                                <View style={styles.modalCardLeft}>
                                    <Image source={require('../../../assets/elements/profile/WhatsApp.svg.webp')} style={styles.modalCardIcon} />
                                </View>
                                <View style={styles.modalCardRight}>
                                    <Text style={styles.modalCardText}>WhatsApp</Text>
                                </View>
                            </TouchableOpacity>

                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </ResponsiveBackground>
    );
}

const styles = StyleSheet.create({
    image: {
        height: height * 0.35,
        width: Math.min(width, 440),
        resizeMode: 'cover',
    },
    inviteContainer: {
        display: 'flex',
        flexDirection: 'column',
        width: Math.min(440, width) * 0.90,
        paddingTop: 20,
        alignItems: 'center',
        alignSelf: 'center',
    },
    invitationTitle: {
        fontSize: 18,
        fontFamily: 'Route159-HeavyItalic',
        color: '#C2000E',
        textAlign: 'center',
        width: Math.min(440, width) * 0.45,
    },

    invitationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        // marginBottom: '6%',
        marginTop: '3%',
        width: '100%',
        paddingHorizontal: '8%',
        paddingVertical: '5%',
        flexDirection: 'column',
        alignItems: 'center',
    },
    invitationDescription: {
        fontSize: 14,
        fontFamily: fonts.default,
        color: '#C2000E',
        marginBottom: '5%',
        textAlign: 'center',
        width: Math.min(440, width) * 0.7,
    },
    inviteSection: {
        backgroundColor: '#C2000E',
        borderRadius: 10,
        marginHorizontal: 16,
        paddingHorizontal: '10%',
        paddingVertical: '3%',
        flexDirection: 'column',
        // justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: 10,
    },
    inviteList: {
        backgroundColor: 'transparent',
        borderColor: '#C2000E',
        borderWidth: 2,
        borderRadius: 10,
        // marginHorizontal: "5%",
        width: '100%',
        marginTop: '3%',
        paddingHorizontal: '6%',
        paddingVertical: '3%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        // marginBottom: 10,
    },
    inviteListTitle: {
        fontSize: 18,
        fontFamily: fonts.regular,
        color: '#C2000E',
        textAlign: 'center',
        alignSelf: 'flex-start'
        // width: Math.min(440, width) * 0.45,
    },
    inviteListStatus: {
        fontSize: 18,
        fontFamily: fonts.bold,
        color: '#C2000E',
        textAlign: 'center',
        alignSelf: 'flex-end',
        alignItems: 'center',
        width: '40%',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end'
    },
    inviteSectionTitle: {
        fontSize: 16,
        fontFamily: fonts.bold,
        color: '#FFF',
        marginBottom: '2%',
        textAlign: 'center',
        // width: '80%',
    },
    inviteSectionDescription: {
        fontSize: 10,
        fontFamily: fonts.regular,
        color: '#FFF',
        // marginBottom: 20,
        textAlign: 'center',
        // width: '80%',
    },
    inviteText: {
        fontSize: 20,
        fontFamily: 'Route159-HeavyItalic',
        alignSelf: 'center'
    },
    inviteBtn: {
        marginVertical: '8%'
    },
    invitationListTitle: {
        fontSize: 20,
        fontFamily: 'Route159-HeavyItalic',
        color: '#C2000E',
        textAlign: 'center',
        width: Math.min(440, width) * 0.45,
    },
    horizontalLine: {
        height: 2,
        backgroundColor: '#C2000E',
        marginTop: '3%',
        width: '105%',
    },
    invitationListCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        // marginBottom: '6%',
        // height: height * 0.4,
        width: '100%',
        paddingHorizontal: '8%',
        paddingVertical: '5%',
        flexDirection: 'column',
        alignItems: 'center',
        // marginBottom: '100%'
    },
    modalCard: {
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#e3e3e3',
        borderRadius: 14,
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 18,
        width: 280,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
        // alignSelf: 'center',
        justifyContent: 'center'
    },
    modalCardLeft: {
        marginRight: 20,
        alignItems: 'center',
        justifyContent: 'center',
        // alignItems: 'center'
    },
    modalCardIcon: {
        width: 58,
        height: 58,
        resizeMode: 'contain',
    },
    modalCardRight: {
        flex: 1,
        justifyContent: 'center',
        // alignItems: 'center'
    },
    modalCardText: {
        fontSize: 22,
        color: '#C2000E',
        fontWeight: 'bold',
        letterSpacing: 1.2,
        fontFamily: 'Route159-HeavyItalic',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginTop: 20,
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
