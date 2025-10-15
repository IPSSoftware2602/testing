import React, { useState, useEffect } from 'react';
import { Image, TouchableOpacity, View, Modal, Text, Platform, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { fonts } from '../../styles/common';

const FileUploader = ({
    value,
    onImageChange,
    placeholder = "Select Image",
    style,
    imageStyle,
    size = 120,
    showCameraIcon = true
}) => {
    const [showImagePicker, setShowImagePicker] = useState(false);

    // Get colors based on theme (defaulting to light theme)
    const colors = Colors.light;

    useEffect(() => {
        return () => {
            setShowImagePicker(false); // Reset modal state when unmounting
        };
    }, []);

    const requestPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera roll permissions to select images.');
                return false;
            }
        }
        return true;
    };

    const requestCameraPermissions = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
                return false;
            }
        }
        return true;
    };

    const handleImagePicker = async (option) => {
        setShowImagePicker(false);

        setTimeout(async () => {
            try {
                let result;

                if (option === 'camera') {
                    const hasPermission = await requestCameraPermissions();
                    if (!hasPermission) return;

                    result = await ImagePicker.launchCameraAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    });
                } else if (option === 'gallery') {
                    const hasPermission = await requestPermissions();
                    if (!hasPermission) return;

                    result = await ImagePicker.launchImageLibraryAsync({
                        mediaTypes: ImagePicker.MediaTypeOptions.Images,
                        allowsEditing: true,
                        aspect: [1, 1],
                        quality: 0.8,
                    });
                }

                if (!result.canceled && result.assets && result.assets[0]) {
                    // onImageChange(result.assets[0].uri);
                    onImageChange(result.assets[0]);
                }
            } catch (error) {
                console.error('Error picking image:', error);
                Alert.alert('Error', 'Failed to select image. Please try again.');
            }
        }, 600); //add delay, to make sure that the modal fully dissapear
    };

    const defaultImageStyle = {
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'transparent',
        borderColor: '#DDDDDD',
        borderWidth: 1,
        borderStyle: 'dashed',
    };

    return (
        <View>
            <TouchableOpacity
                onPress={() => setShowImagePicker(true)}
                style={[defaultImageStyle, imageStyle]}
            >
                {value ? (
                    <Image
                        // source={{ uri: value }}
                        source={{ uri: value.uri }}
                        style={[defaultImageStyle, imageStyle]}
                    />
                ) : (
                    <View style={[defaultImageStyle, imageStyle, { justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image" size={size * 0.4} color="#999" />
                        <Text style={{ fontFamily: fonts.regular, color: "#999" }}>Upload Image</Text>
                    </View>
                )}

                {showCameraIcon && (
                    <TouchableOpacity
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            backgroundColor: "#C2000E",
                            borderRadius: 20,
                            width: 40,
                            height: 40,
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderWidth: 3,
                            borderColor: 'white',
                        }}
                        onPress={() => setShowImagePicker(true)}
                    >
                        <Ionicons name="camera" size={20} color="white" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>

            {/* Image Picker Modal */}
            <Modal
                visible={showImagePicker}
                transparent={true}
                animationType="slide"
            >
                <View style={{
                    flex: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                }}>
                    <View style={{
                        backgroundColor: 'white',
                        padding: 20,
                        borderRadius: 20,
                        width: '80%',
                        maxWidth: 300,
                        alignItems: 'center',
                    }}>
                        <Text style={{
                            fontSize: 20,
                            fontWeight: 'bold',
                            marginBottom: 20,
                            color: colors.text,
                        }}>
                            Choose Photo
                        </Text>

                        {Platform.OS !== 'web' && (
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderWidth: 1,
                                    borderColor: '#ddd',
                                    borderRadius: 10,
                                    marginBottom: 10,
                                    width: '100%',
                                    backgroundColor: '#f9f9f9',
                                }}
                                onPress={() => handleImagePicker('camera')}
                            >
                                <Ionicons name="camera" size={24} color="#C2000E" />
                                <Text style={{
                                    marginLeft: 10,
                                    fontSize: 16,
                                    fontWeight: '500',
                                    color: colors.text,
                                }}>
                                    Take Photo
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                padding: 15,
                                borderWidth: 1,
                                borderColor: '#ddd',
                                borderRadius: 10,
                                marginBottom: 10,
                                width: '100%',
                                backgroundColor: '#f9f9f9',
                            }}
                            onPress={() => handleImagePicker('gallery')}
                        >
                            <Ionicons name="images" size={24} color="#C2000E" />
                            <Text style={{
                                marginLeft: 10,
                                fontSize: 16,
                                fontWeight: '500',
                                color: colors.text,
                            }}>
                                {Platform.OS === 'ios' ? 'Choose from Gallery' : 'Choose from File'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={{
                                padding: 15,
                                borderWidth: 1,
                                borderColor: '#ddd',
                                borderRadius: 10,
                                backgroundColor: '#f0f0f0',
                                width: '100%',
                                alignItems: 'center',
                                marginTop: 10,
                            }}
                            onPress={() => setShowImagePicker(false)}
                        >
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                color: colors.text,
                            }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

export default FileUploader; 