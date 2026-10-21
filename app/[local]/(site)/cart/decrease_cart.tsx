"use client";

import decrease_cart from "@/app/server/cart_decrease";

export default function Decrease_cart_btn({ slug, quantity }: { slug: string; quantity: number }) {
    return (
        <button type="button" className="hidden md:flex-center button2 aspect-square! p-0! w-10!" onClick={() => quantity > 1 && decrease_cart(slug)}>
            -
        </button>
    );
}
