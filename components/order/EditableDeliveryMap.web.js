'use client';

import React, { useEffect, useRef, useState } from 'react';
import { View, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export default function EditableDeliveryMapWeb({
    initialLatLng = { latitude: 3.139, longitude: 101.6869 },
    onLocationChange,
    styles,
    autoComplete = false
}) {
    const [isClient, setIsClient] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markerRef = useRef(null);
    const autocompleteRef = useRef(null);
    // const debounceTimerRef = useRef(null);
    const geocoderRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsClient(true);
            loadGoogleMaps();
        }
    }, []);

    useEffect(() => {
        if (mapLoaded && mapRef.current) {
            initializeMap();
        }
    }, [mapLoaded]);

    useEffect(() => {
        if (mapLoaded && mapRef.current && initialLatLng) {
            // Initialize geocoder
            geocoderRef.current = new window.google.maps.Geocoder();

            // Reverse geocode initial location
            geocoderRef.current.geocode(
                {
                    location: {
                        lat: initialLatLng.latitude,
                        lng: initialLatLng.longitude
                    }
                },
                (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const address = results[0].formatted_address;
                        const streetName = getStreetName(results[0]);

                        if (onLocationChange) {
                            onLocationChange({
                                latitude: initialLatLng.latitude,
                                longitude: initialLatLng.longitude,
                                address,
                                streetName
                            });
                        }
                    }
                }
            );
        }
    }, [mapLoaded]);

    const loadGoogleMaps = () => {
        if (window.google && window.google.maps && window.google.maps.places) {
            setMapLoaded(true);
            return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030&libraries=places`;
        script.async = true;
        script.onload = () => setMapLoaded(true);
        document.head.appendChild(script);
    };

    const initializeMap = () => {
        const center = {
            lat: initialLatLng.latitude,
            lng: initialLatLng.longitude,
        };

        const map = new window.google.maps.Map(mapRef.current, {
            center,
            zoom: 15,
            disableDefaultUI: true,
            gestureHandling: "greedy",  // Allows zooming/panning by user
            fullscreenControl: false, // Explicitly hides the expand (fullscreen) button
            streetViewControl: false,
        });

        // Add draggable marker
        const marker = new window.google.maps.Marker({
            position: center,
            map,
            draggable: true,
            title: "Delivery Address",
        });


        // When user drags marker, update location
        marker.addListener('dragend', (e) => {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();

            // Create geocoder if it doesn't exist
            if (!geocoderRef.current) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            // Reverse geocode the position
            geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const address = results[0].formatted_address;
                    const streetName = getStreetName(results[0]); // Helper function

                    if (onLocationChange) {
                        onLocationChange({
                            latitude: lat,
                            longitude: lng,
                            address,          // Full formatted address
                            streetName       // Just the street name
                        });
                    }
                }
            });
        });

        // Listen for map drag/pan events to update marker position
        map.addListener('dragend', () => {
            const center = map.getCenter();
            const lat = center.lat();
            const lng = center.lng();

            // Update marker position
            if (markerRef.current) {
                markerRef.current.setPosition({ lat, lng });
            }

            // Create geocoder if it doesn't exist
            if (!geocoderRef.current) {
                geocoderRef.current = new window.google.maps.Geocoder();
            }

            // Reverse geocode the position
            geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const address = results[0].formatted_address;
                    const streetName = getStreetName(results[0]);

                    if (onLocationChange) {
                        onLocationChange({
                            latitude: lat,
                            longitude: lng,
                            address,
                            streetName
                        });
                    }
                }
            });
        });

        // Store refs
        mapInstance.current = map;
        markerRef.current = marker;
        geocoderRef.current = new window.google.maps.Geocoder();

        if (autoComplete) {
            // Initialize autocomplete after a small delay to ensure the input is rendered
            setTimeout(() => {
                initAutocompleteSearch(map);
            }, 100);
        }
    };

    // Helper function to extract street name
    const getStreetName = (geocodeResult) => {
        // Look through address components for 'route' (street name)
        const route = geocodeResult.address_components.find(component =>
            component.types.includes('route')
        );
        return route ? route.long_name : '';
    }

    const initAutocompleteSearch = (map) => {
        // const input = document.getElementById("autocomplete-input");
        if (!inputRef.current) return;

        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
            fields: ["geometry", "formatted_address"],
        });

        autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            if (!place.geometry) return;

            const location = place.geometry.location;
            const lat = location.lat();
            const lng = location.lng();

            // Move map and marker
            map.panTo(location);
            map.setZoom(15);
            markerRef.current.setPosition(location);

            if (onLocationChange) {
                onLocationChange({
                    latitude: lat,
                    longitude: lng,
                    address: place.formatted_address
                });
            }
        });

        autocompleteRef.current = autocomplete;
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
            {autoComplete && (
                // <div style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <div style={{
                    position: 'absolute',
                    width: '90%',
                    top: 10,
                    alignSelf: 'center',
                    zIndex: 100,
                    display: 'flex',
                }}>
                    <input
                        ref={inputRef} // Use ref instead of ID
                        type="text"
                        placeholder="Search delivery address"
                        style={{
                            width: Math.min(width, 440) * 0.9,
                            padding: '12px',
                            fontSize: '16px',
                            borderRadius: 8,
                            border: '1px solid #ccc',
                            backgroundColor: '#FFF'
                        }}
                    />
                </div>
            )
            }
            <div
                ref={mapRef}
                style={{ height: '100%', width: '100%', borderRadius: 10 }}
            />
        </View >
    );
}