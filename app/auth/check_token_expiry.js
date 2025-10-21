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

    const redirectToLogin = useCallback(async () => {
        if (isRedirecting) {
            return;
        }
        isRedirecting = true;
        await clearAuthState();
        router.replace('/screens/auth/login');
        isRedirecting = false;
    }, [clearAuthState, router]);

    const checkToken = useCallback(async () => {
        const token = await AsyncStorage.getItem('authToken');
        if (!token) {
            await redirectToLogin();
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const now = Date.now() / 1000;

            if (decoded.exp && decoded.exp < now) {
                await redirectToLogin();
            }
        } catch {
            await redirectToLogin();
        }
    }, [redirectToLogin]);

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
