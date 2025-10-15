import { useToast as useNativeToast } from 'react-native-toast-notifications';
import { Platform } from 'react-native';
import { useMemo, useCallback } from 'react';

export function useToast() {
    const nativeToast = useNativeToast();

    const show = useCallback((message, options = {}) => {
        // For web in production, use our custom implementation
        if (Platform.OS === 'web' && window.showWebToast) {
            window.showWebToast(message, options);
        } else {
            // For native or local development, use the library
            nativeToast.show(message, options);
        }
    }, [nativeToast]);

    return useMemo(() => ({
        show,
        hide: nativeToast.hide,
        update: nativeToast.update,
        hideAll: nativeToast.hideAll
    }), [nativeToast.hide, nativeToast.hideAll, nativeToast.update, show]);
}
