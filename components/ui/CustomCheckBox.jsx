import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export const CustomCheckbox = ({ checked, onPress, color = "#C2000E", borderColor = "black", size = 22 }) => {

  const renderCheckIcon = () => {
    if (!checked) return null;
    return <MaterialIcons name="check" size={size - 4} color="white" />
  };


  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.box, { borderColor: checked ? color : borderColor, width: size, height: size, backgroundColor: checked ? color : "transparent" }]}>

      {/* {checked && (
        <MaterialIcons name="check" size={size - 4} color={"white"} />
      )} */}
      {renderCheckIcon()}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  box: {
    margin: 3,
    marginRight: '2%',
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
