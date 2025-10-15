import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function NotificationModal({ visible, message, onClose, title }) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        minWidth: 260,
        maxWidth: Math.min(440 * 0.8, width * 0.8),
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#C2000E',
        marginBottom: 12,
    },
    message: {
        fontSize: 16,
        color: '#333',
        marginBottom: 24,
        textAlign: 'center',
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