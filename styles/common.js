import { Assets } from '@react-navigation/elements';
import { Dimensions, StyleSheet, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

export const colors = {
  primary: '#FF6B6B',
  secondary: '#4ECDC4',
  background: '#FFFFFF',
  text: '#333333',
  textLight: '#666666',
  border: '#DDDDDD',
  error: '#FF3B30',
  success: '#34C759',
};

// Default font family configuration
export const fonts = {
  default: 'RobotoSlab-Regular',
  bold: 'RobotoSlab-Bold',
  regular: 'RobotoSlab-Regular',
};

// Global text styles with default font family
export const textStyles = StyleSheet.create({
  // Default text styles
  default: {
    fontFamily: fonts.default,
    fontSize: 16,
    lineHeight: 24,
  },
  small: {
    fontFamily: fonts.default,
    fontSize: 14,
    lineHeight: 20,
  },
  large: {
    fontFamily: fonts.default,
    fontSize: 18,
    lineHeight: 26,
  },

  // Bold text styles
  bold: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 24,
  },
  boldSmall: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },
  boldLarge: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 26,
  },

  // Title styles
  title: {
    fontFamily: fonts.default,
    fontSize: 20
  },
  titleLarge: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: fonts.default,
    fontSize: 13,
    lineHeight: 28,
  },

  // Button text styles
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: width <= 440 ? (width <= 375 ? (width <= 360 ? 10 : 11) : 11) : 12,
    lineHeight: 24,
  },
  buttonTextSmall: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
  },

  // Input text styles
  inputText: {
    fontFamily: fonts.default,
    fontSize: 16,
    lineHeight: 24,
  },

  // Link text styles
  link: {
    fontFamily: fonts.default,
    fontSize: 16,
    lineHeight: 24,
    color: '#0a7ea4',
  },
});

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  outerWrapper: {
    flex: 1,
    backgroundColor: width > 440 && Platform.OS === 'web' ? '#C2000E' : 'white',
  },
  contentWrapper: {
    flex: 1,
    alignSelf: 'center',
    width: Math.min(width, 440),
    backgroundColor: 'transparent',
  },
  containerStyle: {
  paddingBottom: width === 390 && height === 844
    ? height * 0.18
    : width <= 425
    ? Platform.OS === 'android'
      ? height * 0.18
      : height * 0.18
    : width > 440
    ? height * 0.14
    : height * 0.15,
    width: Math.min(width, 460),
    alignSelf: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 20,
    fontFamily: fonts.default,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 12,
    fontFamily: fonts.default,
    width: '100%',
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: fonts.default,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  topBar: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    paddingHorizontal: 16,
    justifyContent: 'center',
    // ...(Platform.OS === 'web' && width > 440
    //   ? { width: '100%', maxWidth: 425 }
    //   : { width: '100%' }),
    width: Math.min(width, 440),
    alignSelf: "center",
  },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 18,
    zIndex: 2,
  },
  topBarText: {
    color: '#E60012',
    fontWeight: 'bold',
    fontSize: 20,
    letterSpacing: 1,
    fontFamily: 'Route159-HeavyItalic',
  },
  // Default text style with RobotoSlab-Regular
  defaultText: {
    fontFamily: fonts.default,
  },
  alignLeft: {
    justifyContent: 'flex-start',
  },
  alignRight: {
    justifyContent: 'flex-end',
  },
  column: {
    flexDirection: 'column',
  },
  row: {
    flexDirection: 'row',
  },
}); 