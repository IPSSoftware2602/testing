import React from 'react';
import { Modal, View, Text, StyleSheet, Dimensions, Platform, Linking } from 'react-native';
import { Image } from 'expo-image';
import PolygonButton from './PolygonButton';

const { width } = Dimensions.get('window');

export default function ForceUpdateModal({ isVisible }) {
    const handleUpdate = () => {
        if (Platform.OS === 'ios') {
            // Replace with your actual App Store URL
            Linking.openURL('https://apps.apple.com/my/app/us-pizza-my/id6755192148');
        } else if (Platform.OS === 'android') {
            // Replace with your actual Play Store URL if different
            Linking.openURL('https://play.google.com/store/apps/details?id=com.ipskl168.uspizza');
        }
    };

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            // Prevent closing on Android back button
            onRequestClose={() => { }}
        >
            <View style={styles.container}>
                <View style={styles.modalContent}>
                    <Image
                        source={require('../../assets/images/uspizza-newicon.png')}
                        style={styles.icon}
                        contentFit="contain"
                    />
                    <Text style={styles.title}>Update Required</Text>
                    <Text style={styles.message}>
                        A new version of the app is available. Please update to continue using US Pizza.
                    </Text>

                    <PolygonButton
                        text="Update Now"
                        width={200}
                        height={35}
                        color="#C2000E"
                        textColor="#FFF"
                        onPress={handleUpdate}
                        textStyle={styles.buttonText}
                    />
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        width: Math.min(width * 0.9, 400),
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    icon: {
        width: 80,
        height: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#C2000E',
        marginBottom: 10,
        fontFamily: 'Route159-Bold',
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
        fontFamily: 'RobotoSlab-Regular',
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        fontFamily: 'Route159-Bold',
    },
});
