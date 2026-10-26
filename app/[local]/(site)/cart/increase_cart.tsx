"use client";

import increase_cart from "@/app/server/cart_increase";

export default function Increase_cart_btn({ slug, quantity, max }: { slug: string; quantity: number; max: number }) {
    return (
        <button type="button" className="flex-center button2 aspect-square! p-0! w-10!" onClick={() => quantity < max && increase_cart(slug)}>
            +
        </button>
    );
}
