"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface AuthContextValue {
    user: User | null;
    isLoading: boolean;
    requestLink: (email: string, displayName?: string) => Promise<void>;
    verifyToken: (token: string, displayName?: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
            .then((res) => res.json())
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setIsLoading(false));
    }, []);

    async function requestLink(email: string, displayName?: string) {
        const res = await fetch(`${API_URL}/api/auth/request-link`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, display_name: displayName }),
        });
        // The backend's success response is intentionally generic (same
        // message whether or not the email has an account — see
        // GENERIC_LINK_RESPONSE in app/routes/auth.py), but a non-2xx here
        // means the request itself failed (bad email format, a downstream
        // email-provider error), which is worth surfacing rather than
        // telling someone to check an inbox that was never actually mailed.
        if (!res.ok) throw new Error("Couldn't send the login link");
    }

    async function verifyToken(token: string, displayName?: string) {
        const res = await fetch(`${API_URL}/api/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ token, display_name: displayName }),
        });
        if (!res.ok) throw new Error("That login link is no longer valid");
        setUser(await res.json());
    }

    async function logout() {
        await fetch(`${API_URL}/api/auth/logout`, {
            method: "POST",
            credentials: "include",
        });
        setUser(null);
    }
    
    return (
        <AuthContext.Provider value={{ user, isLoading, requestLink, verifyToken, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
