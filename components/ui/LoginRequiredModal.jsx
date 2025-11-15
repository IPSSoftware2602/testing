import React, { useEffect, useRef } from 'react';
import { Text, TouchableOpacity, View, Modal, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
const { width } = Dimensions.get('window');
const supportsNativeDriver = Platform.OS !== 'web';

export default function LoginRequiredModal({
    isVisible,
    onConfirm,
    onCancel
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
                    <Text style={styles.title}>Login Required</Text>
                    <Text style={styles.subtitle}>Please login to access this feature.</Text>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.confirmBtn]}
                            onPress={onConfirm}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.buttonText, styles.confirmText]}>OK</Text>
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
        borderRadius: 16,
        width: Math.min(width, 440) * 0.8,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: '#C2000E',
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
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtn: {
        backgroundColor: '#C2000E',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    confirmText: {
        color: '#FFF',
        fontFamily: 'Route159-Bold',
    },
});

