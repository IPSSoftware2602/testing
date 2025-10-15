import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Svg, { Path, Circle } from 'react-native-svg';

export default function MapViewNative({ driverPos, pointA, pointB, styles, mapRef: externalMapRef }) {
  const mapRef = useRef(null);
  const mapInstance = externalMapRef || mapRef;
  const [mapError, setMapError] = useState(false);

  // Calculate distance between driver and destination
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371; // km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get zoom level based on distance
  const getZoomLevel = (distance) => {
    if (distance < 0.5) return 0.001; // Less than 500m - very close zoom
    if (distance < 1) return 0.003;   // Less than 1km - close zoom
    return 0.005; // Default zoom
  };

  // Only animate to driver position once when map is first ready
  // const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (mapInstance.current && driverPos) {
      try {
        const distance = getDistance(
          driverPos.latitude,
          driverPos.longitude,
          pointB.latitude,
          pointB.longitude
        );

        const zoomDelta = getZoomLevel(distance);

        // Only animate once to avoid blinking
        mapInstance.current.animateToRegion(
          {
            latitude: driverPos.latitude,
            longitude: driverPos.longitude,
            latitudeDelta: zoomDelta,
            longitudeDelta: zoomDelta,
          },
          3000
        );
        // setHasAnimated(true);
      } catch (error) {
        console.warn('Map animation error:', error);
      }
    }
  }, [driverPos, pointB]);

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
        style={{ flex: 1, height: 250, borderRadius: 12 }}
        initialRegion={{
          latitude: (pointA.latitude + pointB.latitude) / 2,
          longitude: (pointA.longitude + pointB.longitude) / 2,
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
        {/* Driver marker */}
        {/* {driverPos && (
          <Marker
            coordinate={driverPos}
            title="Driver"
            description="Your driver's current location"
            pinColor="#4285F4"
          />
        )} */}

        {/* Point A marker (pickup) */}
        {/* <Marker
          coordinate={pointA}
          title="Pickup Location"
          description="Starting location"
          pinColor="#34A853"
        /> */}

        {/* Point B marker (delivery) */}
        {/* <Marker
          coordinate={pointB}
          title="Delivery Location"
          description="Destination"
          pinColor="#EA4335"
        /> */}

        {driverPos && (
          <Marker
            coordinate={driverPos}
            title="Driver"
            description="Your driver's current location"
            anchor={{ x: 0.5, y: 0.5 }}>
            <Image source={require('../../assets/elements/order/driver.png')} style={{ width: 40, height: 40 }} />
          </Marker>
        )}

        {/* Point A marker (pickup) */}
        <Marker key="pickup-marker"
          coordinate={pointA}
          title="Pickup Location"
          description="Starting location"
          anchor={{ x: 0.5, y: 1 }}>
          <Image source={require('../../assets/elements/order/restaurant-icon.png')} style={{ width: 35, height: 50 }} />
        </Marker>

        {/* Point B marker (delivery) */}
        <Marker key="delivery-marker"
          coordinate={pointB}
          title="Delivery Location"
          description="Destination"
          anchor={{ x: 0.5, y: 1 }}>
          <Image source={require('../../assets/elements/order/house-icon.png')} style={{ width: 35, height: 50 }} />
        </Marker>


      </MapView>
    </View>
  );
} 