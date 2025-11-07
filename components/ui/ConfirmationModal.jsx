import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, Modal, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
const { width } = Dimensions.get('window');
const supportsNativeDriver = Platform.OS !== 'web';

export default function ConfirmationModal({
    title,
    subtitle,
    confirmationText = "Confirm",
    cancelText = "Cancel",
    onConfirm,
    onCancel,
    isVisible
}) {
    const scaleValue = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        if (isVisible) {
            scaleValue.setValue(0.9);
            Animated.spring(scaleValue, {
                toValue: 1,
                speed: 18,
                bounciness: 8,
                useNativeDriver: supportsNativeDriver,
            }).start();
        }
    }, [isVisible, scaleValue]);

    return (
        <Modal transparent visible={!!isVisible} animationType="fade">
            <View style={styles.overlay}>
                <Animated.View style={[styles.modalBox, { transform: [{ scale: scaleValue }] }]}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelBtn]}
                            onPress={onCancel}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, styles.cancelText]}>{cancelText}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.confirmBtn]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, styles.confirmText]}>{confirmationText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
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
        padding: 20,
    },
    modalBox: {
        backgroundColor: '#FFF',
        borderRadius: 16, // Smoother corners
        width: Math.min(width, 440) * 0.8,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10, // Deeper shadow for depth
        transform: [{ scale: 0.95 }],
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#222',
        marginBottom: 8,
        textAlign: 'center',
        fontFamily: 'Route159-Bold',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
        fontFamily: 'Route159-Regular',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F5F5F7', // Light gray background
    },
    confirmBtn: {
        backgroundColor: '#FF3B30', // Vibrant red
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    cancelText: {
        color: '#007AFF', // Blue for neutral action
        fontFamily: 'Route159-Bold',
    },
    confirmText: {
        color: '#FFF', // White text for contrast
        fontFamily: 'Route159-Bold',
    },
});
