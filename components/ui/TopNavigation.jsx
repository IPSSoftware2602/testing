import { Entypo } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React, { useCallback, useRef, useEffect } from 'react';
import { Text, TouchableOpacity, View, Platform } from 'react-native';
import { commonStyles } from '../../styles/common';

export default function TopNavigation({ title, isBackButton = true, navigatePage, rightElement = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const timeoutRef = useRef(null);
  const backAttemptedRef = useRef(false);
  const pathnameBeforeBackRef = useRef(null);
  const currentPathnameRef = useRef(pathname);

  // Keep current pathname ref updated
  useEffect(() => {
    currentPathnameRef.current = pathname;

    // Track pathname changes to detect if back navigation worked
    if (backAttemptedRef.current && pathnameBeforeBackRef.current) {
      // If pathname changed after back attempt, back() worked - clear the timeout
      if (pathname !== pathnameBeforeBackRef.current) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        backAttemptedRef.current = false;
        pathnameBeforeBackRef.current = null;
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [pathname]);

  // Default safe back logic (used only if no navigatePage prop is given)
  const handleBack = useCallback(() => {
    const currentPath = pathname;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // On web: Check if there's browser history before attempting back
    if (Platform.OS === 'web') {
      const hasHistory = typeof window !== 'undefined' && window.history.length > 1;
      
      if (!hasHistory) {
        router.push('(tabs)/menu');
        return;
      }

      router.back();

      timeoutRef.current = setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname === currentPath) {
          router.push('(tabs)/menu');
        }
        timeoutRef.current = null;
      }, 150);
    } else {
      backAttemptedRef.current = true;
      pathnameBeforeBackRef.current = currentPath;

      router.back();

      timeoutRef.current = setTimeout(() => {
        if (backAttemptedRef.current && 
            pathnameBeforeBackRef.current && 
            pathnameBeforeBackRef.current === currentPathnameRef.current) {
          router.push('(tabs)/menu');
        }
        backAttemptedRef.current = false;
        pathnameBeforeBackRef.current = null;
        timeoutRef.current = null;
      }, 400);
    }
  }, [pathname, router]);

  return (
    <View style={commonStyles.topBar}>
      {isBackButton && (
        <TouchableOpacity
          style={commonStyles.backBtn}
          onPress={navigatePage ? navigatePage : handleBack}
        >
          <Entypo name="chevron-thin-left" size={24} color="#B0B0B0" />
        </TouchableOpacity>
      )}
      <Text style={commonStyles.topBarText}>{title}</Text>
      {rightElement ? (
        <View style={commonStyles.topBarRight}>
          {rightElement}
        </View>
      ) : null}
    </View>
  );
}
