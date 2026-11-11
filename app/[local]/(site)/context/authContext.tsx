"use client";

import { UserData } from "@/types/user";
import { createContext, useContext, useState } from "react";

const AuthContext = createContext<{ session: UserData | undefined; setSession: (session: UserData|undefined) => void }>({ session: undefined, setSession: () => {} });

export function AuthProvider({ children, initialSession }: { children: React.ReactNode; initialSession: UserData | undefined }) {
    const [session, setSession] = useState<UserData | undefined>(initialSession);
    const [previous, setPrevious] = useState<UserData | undefined>(initialSession);

    // A fresh server session (after revalidation) replaces whatever the client had.
    if (previous !== initialSession) {
        setPrevious(initialSession);
        setSession(initialSession);
    }

    return <AuthContext.Provider value={{ session, setSession }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
