import { useCallback, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { AppState, Platform } from 'react-native';
import { apiUrl } from '../constant/constants';
import axios from 'axios';

let isRedirecting = false;

export default function useAuthGuard({ requireAuth = true } = {}) {
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
            'lastActiveTime'
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

        // 1. Check for inactivity timeout (Client-side session)
        const lastActiveTimeStr = await AsyncStorage.getItem('lastActiveTime');
        const nowMs = Date.now();
        const MAX_INACTIVITY_MS = 24 * 60 * 60 * 1000; // 24 hours

        if (lastActiveTimeStr) {
            const lastActiveTime = parseInt(lastActiveTimeStr, 10);
            if (nowMs - lastActiveTime > MAX_INACTIVITY_MS) {
                // Session expired due to inactivity
                await redirectToHome();
                return;
            }
        } else if (token) {
            // Legacy/First run: If token exists but no timestamp, initialize it
            await AsyncStorage.setItem('lastActiveTime', String(nowMs));
        }

        if (!token) {
            if (requireAuth) {
                await redirectToHome();
            }
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const nowSec = nowMs / 1000;

            // 2. Check JWT Expiry
            if (decoded.exp && decoded.exp < nowSec) {
                // Token Expired: Attempt Refresh
                try {
                    const customerDataStr = await AsyncStorage.getItem('customerData');
                    const customerData = customerDataStr ? JSON.parse(customerDataStr) : null;

                    if (customerData?.phone_number) {
                        const response = await axios.post(apiUrl + "verify-api", {
                            phone_number: customerData.phone_number,
                            session_login: true
                        });

                        if (response.data?.status === 'success' && response.data?.token) {
                            // Refresh Success
                            await AsyncStorage.setItem('authToken', response.data.token);
                            // Update activity time
                            await AsyncStorage.setItem('lastActiveTime', String(nowMs));
                            return; // Success, stay logged in
                        }
                    }
                } catch (refreshErr) {
                    // console.log("Token refresh failed", refreshErr);
                }

                // Refresh failed or no phone number -> Logout
                await redirectToHome();
            } else {
                // Token Valid: Update activity time
                await AsyncStorage.setItem('lastActiveTime', String(nowMs));
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
