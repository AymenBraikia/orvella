"use client";

import increase_cart from "@/app/server/cart_increase";

export default function Increase_cart_btn({ slug, quantity }: { slug: string; quantity: number }) {
    return (
        <button type="button" className="hidden md:flex-center button2 aspect-square! p-0! w-10!" onClick={() => quantity < 10 && increase_cart(slug)}>
            +
        </button>
    );
}
