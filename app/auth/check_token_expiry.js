import { useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppState, Platform } from 'react-native';

let isRedirecting = false;

export default function useAuthGuard() {
    const router = useRouter();

    const clearAuthState = useCallback(async () => {
        await AsyncStorage.multiRemove([
            'authToken',
            'customerData',
            'orderType',
            'outletDetails',
            'deliveryAddressDetails',
            'estimatedTime',
            'paymentMethod',
        ]);
    }, []);

    const clearCookies = useCallback(() => {
        if (Platform.OS === 'web' && typeof document !== 'undefined') {
            // Clear all cookies by setting them to expire in the past
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
                const eqPos = cookie.indexOf('=');
                const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
                // Clear cookie by setting it to expire in the past
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
                document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=.${window.location.hostname}`;
            });
        }
    }, []);

    const redirectToHome = useCallback(async () => {
        if (isRedirecting) {
            return;
        }
        isRedirecting = true;
        await clearAuthState();
        clearCookies();
        // Redirect to home page (tabs) so user sees guest page
        router.replace('/(tabs)');
        isRedirecting = false;
    }, [clearAuthState, clearCookies, router]);

    const checkToken = useCallback(async () => {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            await redirectToHome();
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;

            if (decoded.exp && decoded.exp < now) {
                await redirectToHome();
            }
        } catch {
            await redirectToHome();
        }
    }, [redirectToHome]);

    useEffect(() => {
        checkToken();
        const subscription = Platform.OS === 'web'
            ? null
            : AppState.addEventListener('change', status => {
                if (status === 'active') {
                    checkToken();
                }
            }
        );

        return () => {
            subscription?.remove?.();
        };
    }, [checkToken]);

    useFocusEffect(
        useCallback(() => {
            checkToken();
        }, [checkToken])
    );
}
