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

    // Reverse geocode when initial location changes
    useEffect(() => {
        if (mapReady) {
            reverseGeocode(initialLatLng.latitude, initialLatLng.longitude);
        }
    }, [mapReady, initialLatLng]);

    const reverseGeocode = (lat, lng) => {
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
                region={selectedLocation && {
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
                    listViewDisplayed={true}
                    debounce={300}
                    listUnderlayColor="transparent"
                    enablePoweredByContainer={false}
                    keepResultsAfterBlur={false}
                    keyboardShouldPersistTaps={'handled'}

                    onPress={(data, details) => {
                        setTimeout(() => {
                            if (details?.geometry?.location) {
                                const location = {
                                    latitude: details.geometry.location.lat,
                                    longitude: details.geometry.location.lng,
                                    address: data.description
                                };
                                setSelectedLocation(location);
                                onLocationChange?.(location);
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
                        textInputContainer: {
                            backgroundColor: 'white',
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: '#ccc',
                            width: Math.min(width, 440) * 0.9,
                            // paddingVertical: ,
                            paddingHorizontal: 8,
                            marginBottom: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            elevation: Platform.OS === 'android' ? 10 : 0,
                            zIndex: Platform.OS === 'ios' ? 100 : 1,
                        },
                        textInput: {
                            // height: 40,
                            color: 'black',
                            fontSize: 16,
                            // placeholderTextColor: 'black'
                        },
                        listView: {
                            backgroundColor: 'white',
                            zIndex: Platform.OS === 'ios' ? 100 : 1, // ensure dropdown appears on top
                            elevation: 10, // for Android
                            position: 'absolute',
                            top: 50, // push it below input

                        },

                        row: {
                            padding: 13,
                            height: 44,
                            flexDirection: 'row',
                            zIndex: Platform.OS === 'ios' ? 100 : 1,
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
