import React from 'react';
import { Dimensions, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QR_MODAL_SIZE = Math.min(SCREEN_WIDTH, 440) * 0.7;

interface QRCodeModalProps {
  isVisible: boolean;
  onClose: () => void;
  value: string;
  backgroundColor?: string;
}

export default function QRCodeModal({
  isVisible,
  onClose,
  value,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
}: QRCodeModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.modalOverlay, { backgroundColor }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContent}>
          <QRCode
            value={value}
            size={QR_MODAL_SIZE}
            backgroundColor="white"
          />
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
}); 