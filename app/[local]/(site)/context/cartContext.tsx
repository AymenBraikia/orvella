"use client";

import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from "react";
import { useAuth } from "./authContext";
import { User_Cart } from "@/types/user";

type CartContextType = {
    cart: User_Cart;
    subtotal: number;
    totalItems: number;
};

const EMPTY_CART: User_Cart = [];

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<User_Cart>(EMPTY_CART);
    const { session } = useAuth();

    useEffect(() => {
        if (session) {
            setCart(session.cart ?? EMPTY_CART);
            return;
        }
    }, [session]);

    const subtotal = useMemo(() => {
        return cart.reduce((total, item) => total + item.price * item.quantity, 0);
    }, [cart]);

    const totalItems = useMemo(() => {
        return cart.reduce((total, item) => total + item.quantity, 0);
    }, [cart]);

    return (
        <CartContext.Provider
            value={{
                cart,
                subtotal,
                totalItems,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error("useCart must be used within a CartProvider");
    return context;
}
