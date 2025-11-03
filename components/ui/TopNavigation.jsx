import { Entypo } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../../styles/common';

export default function TopNavigation({ title, isBackButton = true, navigatePage }) {
  const router = useRouter();
  const pathname = usePathname();

  // Default safe back logic (used only if no navigatePage prop is given)
  const handleBack = () => {
    const currentPath = pathname;

    router.back();

    setTimeout(() => {
      if (window.location.pathname === currentPath) {
        router.push('(tabs)/menu'); // fallback route
      }
    }, 200);
  };

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
    </View>
  );
}