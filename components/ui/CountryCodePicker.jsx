// CR-003: Country code picker.
//
// Tap the trigger → a slide-up Modal opens (mimics bottom-sheet UX with no extra
// deps), with a search bar at top and a scrollable country list below. Single
// tap on a row selects + closes. Works on iOS, Android, Expo Web identically
// because it uses only react-native primitives + Animated.

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { COUNTRIES, DEFAULT_COUNTRY, findCountryByDial } from '../../constants/countries';

const SHEET_MAX_HEIGHT = 0.85; // 85% of screen height — the "snap point"

// On web the app is centered in a 440px-wide phone-shaped container
// (see styles/common.js contentWrapper). Match that width for the bottom sheet
// so it visually anchors to the container instead of spanning the entire
// browser window. On native iOS/Android the modal occupies the whole device,
// so the side offset stays at 0.
const APP_CONTAINER_WIDTH = 440;
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SHEET_SIDE_OFFSET =
  Platform.OS === 'web' && SCREEN_WIDTH > APP_CONTAINER_WIDTH
    ? (SCREEN_WIDTH - APP_CONTAINER_WIDTH) / 2
    : 0;

/**
 * Props:
 *   value:    string dial code currently selected, e.g. "+60"
 *   onChange: (dial: string, country: { name, code, dial }) => void
 *   triggerStyle / textStyle: optional style overrides for the inline trigger button
 *   disabled: bool — gray out the trigger
 */
export default function CountryCodePicker({
  value,
  onChange,
  triggerStyle,
  textStyle,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = visible
  const searchRef = useRef(null);

  const selected =
    findCountryByDial(value) || DEFAULT_COUNTRY;

  // Slide animation on open / close.
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: open ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();

    if (open) {
      // Small delay so keyboard doesn't fight the slide animation on mobile.
      const t = setTimeout(() => searchRef.current?.focus?.(), 250);
      return () => clearTimeout(t);
    }
    setQuery('');
  }, [open, slideAnim]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => {
      return (
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.dial.replace('+', '').includes(q.replace('+', ''))
      );
    });
  }, [query]);

  const handleSelect = country => {
    onChange?.(country.dial, country);
    setOpen(false);
  };

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [600, 0],
  });

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.45],
  });

  return (
    <>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Country code, currently ${selected.dial}`}
        onPress={() => !disabled && setOpen(true)}
        style={[styles.trigger, triggerStyle, disabled && styles.triggerDisabled]}
        activeOpacity={0.7}
      >
        <Text style={[styles.triggerText, textStyle]}>{selected.dial}</Text>
        <Text style={[styles.triggerCaret, textStyle]}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={() => setOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={() => setOpen(false)}>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
          </TouchableWithoutFeedback>

          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.handleBar} />
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>Select country</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={12}>
                <Text style={styles.closeBtn}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.searchWrap}>
              <TextInput
                ref={searchRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Search country or code"
                placeholderTextColor="#999"
                style={styles.searchInput}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
              />
            </View>

            <FlatList
              data={filtered}
              keyExtractor={c => `${c.code}-${c.dial}`}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No countries match “{query}”.</Text>
              }
              renderItem={({ item }) => {
                const isSelected =
                  item.code === selected.code && item.dial === selected.dial;
                return (
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={[styles.row, isSelected && styles.rowSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.rowName, isSelected && styles.rowSelectedText]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.rowDial, isSelected && styles.rowSelectedText]}>
                      {item.dial}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              style={styles.list}
              contentContainerStyle={styles.listContent}
            />
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#f2f2f2',
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: { fontSize: 14, color: '#222', fontWeight: '500' },
  triggerCaret: { marginLeft: 4, fontSize: 12, color: '#666' },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },

  sheet: {
    position: 'absolute',
    left: SHEET_SIDE_OFFSET,
    right: SHEET_SIDE_OFFSET,
    bottom: 0,
    maxHeight: `${SHEET_MAX_HEIGHT * 100}%`,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },

  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ddd',
    marginBottom: 8,
  },

  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  closeBtn: { fontSize: 14, color: '#C2000E', fontWeight: '500' },

  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    color: '#222',
  },

  list: { flexGrow: 0 },
  listContent: { paddingBottom: 24 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#eee',
  },
  rowSelected: { backgroundColor: '#fff5f5' },
  rowSelectedText: { color: '#C2000E', fontWeight: '600' },
  rowName: { fontSize: 14, color: '#222', flex: 1, marginRight: 8 },
  rowDial: { fontSize: 14, color: '#666', fontVariant: ['tabular-nums'] },

  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 24,
    paddingHorizontal: 16,
  },
});
