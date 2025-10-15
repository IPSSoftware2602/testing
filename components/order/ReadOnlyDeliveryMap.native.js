import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Platform, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReadOnlyDeliveryMapNative({ location, address, styles, mapRef: externalMapRef, isEdit = true, addressId }) {
    const mapRef = useRef(null);
    const mapInstance = externalMapRef || mapRef;
    const [mapError, setMapError] = useState(false);
    const router = useRouter();

    if (mapError) {
        return (
            <View style={[styles, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                <Text style={{ color: '#666', fontSize: 16 }}>Map loading failed. Please check your internet connection.</Text>
            </View>
        );
    }

    return (
        <View style={styles}>
            <MapView
                ref={mapInstance}
                style={styles}
                initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                region={location && {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                showsUserLocation={false}
                showsMyLocationButton={false}
                showsCompass={false}
                showsScale={false}
                showsBuildings={false}
                showsTraffic={false}
                showsIndoors={false}
                showsIndoorLevelPicker={false}
                showsPointsOfInterest={false}
                mapType="standard"
                provider="google"
                onError={(error) => {
                    console.error('MapView error:', error);
                    setMapError(true);
                }}
                onMapReady={() => {
                    console.log('MapView loaded successfully');
                }}
            >
                <Marker
                    coordinate={{ latitude: location.latitude, longitude: location.longitude }}
                    title={address || "Delivery Location"}
                    description="Delivery Location"
                />
            </MapView>

            {/* Edit button at bottom right */}
            {isEdit && <TouchableOpacity
                style={{
                    position: 'absolute',
                    bottom: 10,
                    right: 10,
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 50,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 2,
                    elevation: 5,
                }}
                onPress={() => {
                    router.push({
                        pathname: '/screens/home/address_edit_details',
                        params: {
                            lat: location.latitude,
                            lng: location.longitude,
                            addressId: addressId,
                        }
                    });
                }}
            >
                <FontAwesome6 name="pencil" size={20} color="#C2000E" />
            </TouchableOpacity>}
        </View>
    );
}