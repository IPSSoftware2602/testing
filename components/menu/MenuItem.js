import React, { memo } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import PolygonButton from '../ui/PolygonButton';

const { width } = Dimensions.get('window');

const MenuItem = memo(({ 
  item, 
  index, 
  isFirstInCategory, 
  categories, 
  customer, 
  onPress 
}) => {

  const handlePress = () => {
    if (item.is_available) {
      onPress(item.id);
    }
  };

  const categoryLabel = categories.find(c => c.key === item.categoryIds[0])?.label;

  return (
    <>
      {item.categoryIds && item.categoryIds[0] && isFirstInCategory && (
        <Text style={styles.categoryDividerText}>
          {categoryLabel}
        </Text>
      )}

      <TouchableOpacity
        disabled={!item.is_available}
        onPress={handlePress}
      >
        <View style={styles.menuItem}>
          <View style={styles.menuImageContainer}>
            <Image
              source={
                item.image
                  ? { uri: item.image }
                  : require('../../assets/icons/burger.png')
              }
              style={styles.menuImage}
            />
            {(!item.is_available || item.membership_tier === customer?.customer_tier_id) && (
              <View style={styles.notAvailableOverlay}>
                <View style={styles.notAvailableTextContainer}>
                  <Text style={styles.notAvailableText}>Not available</Text>
                </View>
              </View>
            )}
          </View>
          <View style={styles.menuInfo}>
            <Text style={styles.menuName}>{item.name}</Text>
            <Text
              style={styles.menuDesc}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>

            <View style={styles.menuTagContainer}>
              {item.tags.map(tag => (
                <View key={tag.id} style={styles.tagWrapper}>
                  <Image source={tag.icon} style={styles.menuTag} />
                </View>
              ))}
            </View>
            
            <View style={styles.menuPriceRow}>
              <View style={styles.menuOldPriceContainer}>
                <Text style={styles.menuPrice}>RM {item.price}</Text>
                <Text style={styles.menuPriceslash}>RM {item.discount_price}</Text>
              </View>
              {item.is_available ? (
                <PolygonButton
                  text="Choose"
                  // width={width <= 360 ? 55 : 60}
                  width={width <= 440 ? (width <= 375 ? (width <= 360 ? 50 : 60) : 70) : 60}
                  height={20}
                  color="#C2000E"
                  textColor="#fff"
                  textStyle={styles.chooseButtonText}
                  onPress={handlePress}
                />
              ) : (
                <PolygonButton
                  text="Choose"
                  width={width <= 360 ? 55 : 60}
                  height={20}
                  color="#ccc"
                  textColor="#888"
                  textStyle={styles.chooseButtonText}
                  disabled={true}
                  style={styles.disabledButton}
                />
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </>
  );
});

MenuItem.displayName = 'MenuItem';

const styles = StyleSheet.create({
  menuItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    width: '100%',
  },
  menuImage: {
    width: width <= 360 ? 110 : 100,
    height: width <= 360 ? 110 : 100,
    borderRadius: 12,
    margin: 8,
  },
  menuImageContainer: {
    position: 'relative',
  },
  notAvailableOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notAvailableTextContainer: {
    transform: [{ rotate: '-45deg' }],
  },
  notAvailableText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Route159-Bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  menuInfo: {
    flex: 1,
    padding: 8,
    width: 50,
    justifyContent: 'center',
  },
  menuName: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 14) : 18) : 20,
    fontFamily: 'Route159-Heavy',
    textAlign: 'right',
  },
  menuDesc: {
    color: '#888',
    fontSize: 10,
    marginVertical: 4,
    fontFamily: 'RobotoSlab-Regular',
    textAlign: 'right',
    width: '100%',
  },
  menuPriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    marginLeft: 10,
    justifyContent: 'flex-end',
  },
  menuPrice: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 12 : 13) : 14) : 14,
    fontFamily: 'Route159-Bold',
  },
  menuPriceslash: {
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 10 : 10) : 12) : 12,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 12,
    fontFamily: 'Route159-SemiBoldItalic'
  },
  menuOldPriceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    width: '65%',
    padding: 3,
  },
  menuTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    width: '100%',
  },
  tagWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  menuTag: {
    width: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 16) : 18) : 16, 
    height: width <= 440 ? (width <= 375 ? (width <= 360 ? 14 : 16) : 18) : 16, 
    marginLeft: 5,
  },
  categoryDividerText: {
    color: '#C2000E',
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'Route159-Bold',
  },
  chooseButtonText: {
    fontWeight: 'bold',
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 10 : 12) : 13) : 14,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default MenuItem;
