'use client';

import React, { useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function ReadOnlyDeliveryMapWeb({ location = { latitude: 3.139, longitude: 101.6869 }, address, styles, isEdit = true, addressId }) {
    const [isClient, setIsClient] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsClient(true);
            loadGoogleMaps();
            console.log("Received location:", location);
        }
    }, []);

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030&libraries=places';
        script.async = true;
        script.onload = () => setMapLoaded(true);
        script.onerror = (error) => {
            console.error('Google Maps script failed to load', error);
        };
        document.head.appendChild(script);
    };

    useEffect(() => {
        if (mapLoaded && mapRef.current) {
            initializeMap();
            // console.log("Render once");
        }
    }, [mapLoaded, location]);

    const initializeMap = () => {
        const center = {
            lat: location.latitude,
            lng: location.longitude,
        };

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 15,
            disableDefaultUI: true,
            gestureHandling: "none",  // Prevents zooming/panning by user
            fullscreenControl: false, // Explicitly hides the expand (fullscreen) button
            streetViewControl: false,
            draggable: false,
        });

        new window.google.maps.Marker({
            position: center,
            map,
            title: address || "Delivery Location",
            draggable: false,
        });
    };

    if (!isClient) {
        return (
            <View style={styles}>
                <div style={{
                    height: 300,
                    backgroundColor: "#eee",
                    borderRadius: 10,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    Loading Map...
                </div>
            </View>
        );
    }

    return (
        <View style={styles}>
            <div
                ref={mapRef}
                style={{ height: 300, width: '100%', borderRadius: 10 }}
            />

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

            // onPress={onEdit}
            >
                <FontAwesome6 name="pencil" size={20} color="#C2000E" />
            </TouchableOpacity>}
        </View>
    );
}
