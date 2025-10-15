import { Entypo } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { commonStyles } from '../../styles/common';

export default function TopNavigation({ title, isBackButton = true, navigatePage = () => router.back() }) {
  return (
    <View style={commonStyles.topBar}>
      {isBackButton && (
        <TouchableOpacity style={commonStyles.backBtn} onPress={navigatePage}>
          <Entypo name="chevron-thin-left" size={24} color="#B0B0B0" />
        </TouchableOpacity>

      )}
      <Text style={commonStyles.topBarText}>{title}</Text>
    </View>
  );
}
