"use client";

import Cross from "@/app/components/svg/cross";
import revmove_from_cart from "@/app/server/remove_cart";

export default function Remove_cart_btn({ slug }: { slug: string }) {
    return (
        <button type="button" className="hidden md:flex button2 p-0" onClick={() => revmove_from_cart(slug)}>
            <Cross classnames="w-8" />
        </button>
    );
}
