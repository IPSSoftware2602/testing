import React from 'react';
import { View, ImageBackground, Platform, Dimensions, StyleSheet } from 'react-native';
import { commonStyles } from '../styles/common';

const screenWidth = Dimensions.get('window').width;

const ResponsiveBackground = ({ children }) => {
    const isWebWithWideScreen = Platform.OS === 'web' && screenWidth > 440;

    return isWebWithWideScreen ? (
        <ImageBackground
            source={require('../assets/background.png')}
            resizeMode="cover"
            style={styles.outerWrapper}
        >
            <View style={commonStyles.contentWrapper}>
                {children}
            </View>
        </ImageBackground>
    ) : (
        <View style={commonStyles.outerWrapper}>
            <View style={commonStyles.contentWrapper}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerWrapper: {
        flex: 1,
        width: '100%',
        height: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'flex-start',

    },
});

export default ResponsiveBackground;
