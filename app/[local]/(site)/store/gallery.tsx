"use client";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function Gallery() {
    const sources = ["/shop/shop1.webp", "/shop/shop2.webp", "/shop/shop3.webp", "/shop/shop4.webp", "/shop/shop5.webp", "/shop/shop6.webp", "/shop/shop7.webp", "/shop/shop8.webp", "/shop/shop9.webp"];
    const [index, set_index] = useState<number>(0);

    useEffect(() => {
        const interval = setInterval(() => {
            set_index(index + 1 >= sources.length ? 0 : index + 1);
        }, 5e3);

        return () => clearInterval(interval);
    }, [index]);

    return (
        <div className="w-full xl:w-[calc(50%-20px)] h-fit relative aspect-16/12">
            {sources.map((s, i) => (
                <div key={s} className={`w-full h-full absolute inset-s-0 top-0 transition-long ${i == index ? "opacity-100" : "opacity-0"}`}>
                    <div className="relative w-full h-full">
                        <Image fill src={s} alt={s} className="object-cover object-center" />
                    </div>
                </div>
            ))}
        </div>
    );
}
