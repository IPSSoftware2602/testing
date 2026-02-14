import React, { useState, useRef, useEffect } from 'react';
import { View, Dimensions, Text, Platform, TouchableOpacity } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import MapView, { Marker } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
const { width } = Dimensions.get('window');
Geocoder.init('AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030');

export default function EditableDeliveryMapNative({
    initialLatLng = { latitude: 3.139, longitude: 101.6869 },
    onLocationChange,
    styles,
    autoComplete = false,
    mapRef: externalMapRef
}) {

    const [selectedLocation, setSelectedLocation] = useState(initialLatLng);
    const mapRef = useRef(null);
    const mapInstance = externalMapRef || mapRef;
    const [mapError, setMapError] = useState(false);
    const [mapReady, setMapReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const isProgrammaticChange = useRef(false);

    // Reverse geocode when initial location changes
    const prevInitialLatLng = useRef(initialLatLng);
    useEffect(() => {
        if (mapReady) {
            const hasChanged =
                prevInitialLatLng.current.latitude !== initialLatLng.latitude ||
                prevInitialLatLng.current.longitude !== initialLatLng.longitude;

            if (hasChanged) {
                prevInitialLatLng.current = initialLatLng;
                isProgrammaticChange.current = true;
                reverseGeocode(initialLatLng.latitude, initialLatLng.longitude);

                // Animate map to initial location
                if (mapInstance.current) {
                    mapInstance.current.animateToRegion({
                        latitude: initialLatLng.latitude,
                        longitude: initialLatLng.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 500);
                }
            } else if (!selectedLocation.address) {
                // If no address yet, reverse geocode
                reverseGeocode(initialLatLng.latitude, initialLatLng.longitude);
            }
        }
    }, [mapReady, initialLatLng]);

    const reverseGeocode = (lat, lng, skipMapUpdate = false) => {
        if (!skipMapUpdate) {
            isProgrammaticChange.current = true;
        }

        Geocoder.from(lat, lng)
            .then(json => {
                const address = json.results[0]?.formatted_address || '';
                const streetName = getStreetName(json.results[0]);

                const newLocation = {
                    latitude: lat,
                    longitude: lng,
                    address,
                    streetName
                };

                setSelectedLocation(newLocation);
                if (onLocationChange) {
                    onLocationChange(newLocation);
                }

                if (!skipMapUpdate) {
                    // Reset flag after a short delay
                    setTimeout(() => {
                        isProgrammaticChange.current = false;
                    }, 300);
                }
            })
            .catch(error => {
                console.warn('Geocoding error:', error);
                // Fallback to just coordinates if geocoding fails
                const newLocation = {
                    latitude: lat,
                    longitude: lng,
                    address: '',
                    streetName: ''
                };
                setSelectedLocation(newLocation);

                if (!skipMapUpdate) {
                    setTimeout(() => {
                        isProgrammaticChange.current = false;
                    }, 300);
                }
            });
    };

    const getStreetName = (result) => {
        if (!result) return '';
        const streetComponent = result.address_components.find(component =>
            component.types.includes('route')
        );
        return streetComponent?.long_name || '';
    };


    useEffect(() => {
        console.log('Initial location changed:', initialLatLng);
    }, [initialLatLng]);

    if (mapError) {
        return (
            <View style={[styles, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f0f0' }]}>
                <Text style={{ color: '#666', fontSize: 16 }}>Map loading failed. Please check your internet connection.</Text>
            </View>
        );
    }

    return (
        <View style={styles}>
            {/* Map View */}

            <MapView
                ref={mapInstance}
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
                style={{
                    width: '100%',
                    height: '100%',
                    flex: 1
                }}
                initialRegion={{
                    latitude: selectedLocation.latitude || initialLatLng.latitude,
                    longitude: selectedLocation.longitude || initialLatLng.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                onError={(error) => {
                    console.error('MapView error:', error);
                    setMapError(true);
                }}
                onMapReady={() => {
                    console.log('MapView loaded successfully');
                    setMapReady(true);
                }}
                onRegionChangeComplete={(region) => {
                    // Only update location when user pans the map (not programmatic)
                    if (!isProgrammaticChange.current) {
                        const newLat = region.latitude;
                        const newLng = region.longitude;
                        // Check if location changed significantly (avoid tiny drift)
                        const latDiff = Math.abs(newLat - (selectedLocation.latitude || initialLatLng.latitude));
                        const lngDiff = Math.abs(newLng - (selectedLocation.longitude || initialLatLng.longitude));
                        if (latDiff > 0.0001 || lngDiff > 0.0001) {
                            reverseGeocode(newLat, newLng, true);
                        }
                    }
                }}
                scrollEnabled={true}
                zoomEnabled={true}
                pitchEnabled={false}
                rotateEnabled={false}
            >

                <Marker
                    coordinate={{
                        latitude: selectedLocation.latitude || initialLatLng.latitude,
                        longitude: selectedLocation.longitude || initialLatLng.longitude,
                    }}
                    draggable
                    onDragEnd={(e) => {
                        const { latitude, longitude } = e.nativeEvent.coordinate;
                        reverseGeocode(latitude, longitude); // updates address and calls onLocationChange
                    }}
                    title="Selected Location"
                    description="Delivery Location"
                    anchor={{ x: 0.5, y: 0.5 }}
                />

            </MapView>


            {autoComplete && <View style={{
                position: 'absolute',
                width: '90%',
                top: 10,
                alignSelf: 'center',
                zIndex: Platform.OS === 'ios' ? 100 : 1,
                pointerEvents: 'box-none',
                hitSlop: { top: 20, bottom: 20, left: 0, right: 0 },
                backgroundColor: 'transparent',
                elevation: Platform.OS === 'android' ? 10 : 0,
            }}>
                <GooglePlacesAutocomplete
                    placeholder="Search delivery address"
                    fetchDetails={true}
                    predefinedPlaces={[]}
                    textInputProps={{
                        placeholderTextColor: 'black',
                    }}
                    minLength={2}
                    onFail={(error) => console.error('GooglePlacesAutocomplete Error:', error)}
                    timeout={10000}
                    debounce={300}
                    listUnderlayColor="transparent"
                    enablePoweredByContainer={false}
                    keepResultsAfterBlur={false}
                    keyboardShouldPersistTaps={'handled'}

                    onPress={(data, details) => {
                        setTimeout(() => {
                            if (details?.geometry?.location) {
                                isProgrammaticChange.current = true;
                                const location = {
                                    latitude: details.geometry.location.lat,
                                    longitude: details.geometry.location.lng,
                                    address: data.description
                                };
                                setSelectedLocation(location);
                                onLocationChange?.(location);

                                // Animate map to new location
                                if (mapInstance.current) {
                                    mapInstance.current.animateToRegion({
                                        latitude: location.latitude,
                                        longitude: location.longitude,
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }, 500);
                                }

                                setTimeout(() => {
                                    isProgrammaticChange.current = false;
                                }, 600);
                            }
                        }, Platform.OS === 'ios' ? 100 : 0);
                    }}
                    query={{
                        key: 'AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030',
                        language: 'en',
                        origin: `${initialLatLng.latitude},${initialLatLng.longitude}`,
                        location: `${initialLatLng?.latitude},${initialLatLng?.longitude}`,
                        radius: 10000,

                    }}
                    styles={{
                        container: {
                            flex: 1,
                        },
                        textInputContainer: {
                            backgroundColor: 'white',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#ccc',
                            width: Math.min(width, 440) * 0.9,
                            paddingHorizontal: 8,
                            marginBottom: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                        },
                        textInput: {
                            color: 'black',
                            fontSize: 16,
                            marginTop: 3, // align text better
                        },
                        listView: {
                            backgroundColor: 'white',
                            zIndex: 9999,
                            elevation: 10, // for Android
                            position: 'absolute',
                            top: 50,
                            borderRadius: 5,
                            borderWidth: 1,
                            borderColor: '#ddd',
                        },
                        row: {
                            padding: 13,
                            height: 44,
                            flexDirection: 'row',
                        },
                        predefinedPlacesDescription: {
                            color: '#C2000E',
                        },
                    }}
                />
            </View>}
        </View>
    );
};
