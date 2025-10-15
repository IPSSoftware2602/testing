import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

export default function ProofOfDeliveryModal({ visible, imageUrl, onClose }) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>Proof of Delivery</Text>
                    <Image
                        source={{ uri: imageUrl }}
                        style={styles.image}
                        resizeMode="contain"
                    />
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        minWidth: 260,
        maxWidth: 340,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#C2000E',
        marginBottom: 16,
    },
    image: {
        width: 260,
        height: 260,
        borderRadius: 8,
        marginBottom: 20,
        backgroundColor: '#eee',
    },
    button: {
        backgroundColor: '#C2000E',
        borderRadius: 8,
        paddingVertical: 10,
        paddingHorizontal: 32,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});