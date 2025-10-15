'use client';

import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as FileSystem from 'expo-file-system';

export default function MapViewWeb({ driverPos, pointA, pointB, styles }) {
  const [isClient, setIsClient] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    // Only load on client side
    if (typeof window !== 'undefined') {
      setIsClient(true);
      loadGoogleMaps();
    }
  }, []);

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
    if (distance < 0.5) return 16; // Less than 500m - very close zoom
    if (distance < 1) return 15;   // Less than 1km - close zoom
    return 14; // Default zoom
  };

  const loadGoogleMaps = () => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Load Google Maps script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD7M4NLYkYK4ovYJeMNY3tqeuB_Xvrj030&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = initializeMap;
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current) return;

    // Calculate center and bounds
    const center = {
      lat: (pointA.latitude + pointB.latitude) / 2,
      lng: (pointA.longitude + pointB.longitude) / 2,
    };

    // Create map instance
    const map = new window.google.maps.Map(mapRef.current, {
      center: center,
      zoom: 14, // Initial zoom level
      mapTypeId: window.google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ]
    });

    mapInstanceRef.current = map;

    // Add markers
    addMarkers(map);

    setMapLoaded(true);
  };

  const addMarkers = (map) => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Driver marker
    if (driverPos) {
      const driverMarker = new window.google.maps.Marker({
        position: { lat: driverPos.latitude, lng: driverPos.longitude },
        map: map,
        title: 'Driver',
        // icon: {
        //   path: window.google.maps.SymbolPath.CIRCLE,
        //   scale: 10,
        //   fillColor: '#4285F4',
        //   fillOpacity: 1,
        //   strokeColor: '#ffffff',
        //   strokeWeight: 3,
        // },
        icon: {
          url: 'https://icom.ipsgroup.com.my/backend/uploads/map_pointers_icon/driver.png',
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(26, 12)
        },
        zIndex: 2,

      });
      markersRef.current.push(driverMarker);
    }

    // PICKUP LOCATION (Restaurant in red pin)
    const pickupMarker = new window.google.maps.Marker({
      position: { lat: pointA.latitude, lng: pointA.longitude },
      map: map,
      title: 'Pizza Restaurant',
      icon: {
        url: 'https://icom.ipsgroup.com.my/backend/uploads/map_pointers_icon/restaurant-icon.png',
        scaledSize: new window.google.maps.Size(45, 45),
        anchor: new window.google.maps.Point(22, 24)
      },
      // icon: {
      //   url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      //     <!-- Pin shape -->
      //     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
      //           fill="#C2000E"/>
      //     <!-- Restaurant icon centered -->
      //     <path d="M8.1 13.34l2.83-2.83L3.91 3.5c-1.56 1.56-1.56 4.09 0 5.66l4.19 4.18zm6.78-1.81c1.53.71 3.68.21 5.27-1.38 1.91-1.91 2.28-4.65.81-6.12-1.46-1.46-4.2-1.1-6.12.81-1.59 1.59-2.09 3.74-1.38 5.27L3.7 19.87l1.41 1.41L12 14.41l6.88 6.88 1.41-1.41L13.41 13l1.47-1.47z" 
      //       fill="white" transform="translate(7,5) scale(0.4)"/>
      //   </svg>
      // `)}`,
      //   scaledSize: new window.google.maps.Size(50, 70),
      //   anchor: new window.google.maps.Point(25, 54)
      // }
    });

    // DELIVERY LOCATION (House in blue pin)
    const deliveryMarker = new window.google.maps.Marker({
      position: { lat: pointB.latitude, lng: pointB.longitude },
      map: map,
      title: 'Delivery Address',
      icon: {
        url: 'https://icom.ipsgroup.com.my/backend/uploads/map_pointers_icon/house-icon.png',
        scaledSize: new window.google.maps.Size(45, 45),
        anchor: new window.google.maps.Point(25, 24)
      },
      // icon: {
      //   url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      //   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      //     <!-- Pin shape -->
      //     <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
      //           fill="#C2000E"/>
      //     <!-- Home icon centered -->
      //     <path d="M12 6l-6 4.5V18h4v-4h4v4h4v-7.5L12 6z" 
      //       fill="white" 
      //       transform="translate(5,2) scale(0.6)"/>
      //   </svg>
      // `)}`,
      //   scaledSize: new window.google.maps.Size(50, 70),
      //   anchor: new window.google.maps.Point(25, 54)
      // }

    });

    markersRef.current.push(pickupMarker, deliveryMarker);
  };

  // Update driver position and map when it changes
  useEffect(() => {
    if (mapLoaded && driverPos && markersRef.current.length > 0) {
      // Update driver marker position
      const driverMarker = markersRef.current[0];
      if (driverMarker) {
        driverMarker.setPosition({ lat: driverPos.latitude, lng: driverPos.longitude });
      }

      // Calculate distance and update map center and zoom
      const distance = getDistance(
        driverPos.latitude,
        driverPos.longitude,
        pointB.latitude,
        pointB.longitude
      );

      const zoomLevel = getZoomLevel(distance);

      // Center map on driver and set zoom
      mapInstanceRef.current.panTo({ lat: driverPos.latitude, lng: driverPos.longitude });
      mapInstanceRef.current.setZoom(zoomLevel);
    }
  }, [driverPos, mapLoaded]);

  // Don't render anything on server side
  if (!isClient) {
    return (
      <View style={styles}>
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12
        }}>
          <p>Loading map...</p>
        </div>
      </View>
    );
  }

  return (
    <View style={styles}>
      <div style={{
        height: 250,
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginTop: 8
      }}>
        <div
          ref={mapRef}
          style={{
            height: '100%',
            width: '100%',
            borderRadius: 12
          }}
        />
      </div>
    </View>
  );
}
