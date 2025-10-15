import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const CategoryItem = memo(({ 
  item, 
  isActive, 
  onPress 
}) => {
  const handlePress = () => {
    onPress(item.key);
  };

  return (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        isActive && styles.categoryItemActive,
      ]}
      onPress={handlePress}
    >
      <Image
        source={item.icon}
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.categoryLabel,
          isActive && styles.categoryLabelActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );
});

CategoryItem.displayName = 'CategoryItem';

const styles = StyleSheet.create({
  categoryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    width: '100%',
    backgroundColor: '#FCEEDB',
    minHeight: 90,
  },
  categoryItemActive: {
    backgroundColor: '#C2000E',
    width: '100%',
  },
  categoryIcon: {
    width: 36,
    height: 36,
    marginBottom: 6,
  },
  categoryLabel: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 13,
    fontFamily: 'Route159-Bold',
    textAlign: 'center',
    paddingHorizontal: 4,
    flexWrap: 'wrap',
    width: '100%',
  },
  categoryLabelActive: {
    color: '#fff',
  },
});

export default CategoryItem;
