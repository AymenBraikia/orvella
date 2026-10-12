"use client";

import { UserData } from "@/types/user";
import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext<{ session: UserData | undefined; setSession: (session: UserData|undefined) => void }>({ session: undefined, setSession: () => {} });

export function AuthProvider({ children, initialSession }: { children: React.ReactNode; initialSession: UserData | undefined }) {
    const [session, setSession] = useState<UserData | undefined>(initialSession);

    useEffect(() => {
        setSession(initialSession);
    }, [initialSession]);

    return <AuthContext.Provider value={{ session, setSession }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
