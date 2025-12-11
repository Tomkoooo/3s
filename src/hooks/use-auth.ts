"use client"
import { DecodedUser } from "@/lib/auth";
import { useCallback, useEffect, useState } from "react";

export const useAuth = () => {
    const [user, setUser] = useState<DecodedUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/system/session');
            if (!response.ok) {
                setUser(null);
                setIsLoading(false);
                return;
            }
            const data = await response.json();
            setUser(data.user as DecodedUser | null);
        } catch (error) {
            console.error('Auth fetch error:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const anticipate = useCallback(async () => {
        setIsLoading(true);
    }, []);

    const delayCheck = useCallback(async () => {
        anticipate();
        await new Promise(resolve => setTimeout(resolve, 3000));
        fetchUser();
    }, [fetchUser, anticipate]);

    useEffect(() => {
        window.addEventListener('auth-change', fetchUser);
        window.addEventListener('auth-anticipate', anticipate);
        window.addEventListener('auth-delay-check', delayCheck);
        fetchUser();
        return () => {
            window.removeEventListener('auth-change', fetchUser);
            window.removeEventListener('auth-anticipate', anticipate);
            window.removeEventListener('auth-delay-check', delayCheck);
        }
    }, [fetchUser, anticipate, delayCheck]);

    return { user, isLoading };
}