"use client";
import { ActionDispatch, RefObject } from "react";
import Cross from "./svg/cross";
import Info from "./svg/info";
import { useCart } from "../(site)/context/cartContext";
import Image from "next/image";
import Link from "next/link";
import { format_price } from "../(site)/lib/price_format";
import { useTranslations } from "next-intl";
import { read_cookie } from "../(site)/lib/read_cookie";
import { Supported_Currencies } from "@/currency";
type UIAction = { type: "OPEN_NAV" } | { type: "CLOSE_NAV" } | { type: "OPEN_CART" } | { type: "CLOSE_CART" } | { type: "TOGGLE_LANG" } | { type: "SET_GLASSY"; payload: boolean };

export default function Cart_drawer({ dispatch, ui, ref }: { ref: RefObject<HTMLDivElement | null>; dispatch: ActionDispatch<[action: UIAction]>; ui: { isCartOpen: boolean } }) {
    const { cart, subtotal } = useCart();
    const t = useTranslations("cart");

    const currency = read_cookie("Currency") as Supported_Currencies;

    return (
        <div
            ref={ref}
            className={`bg-background z-70 w-dvw sm:min-w-100 sm:w-[70dvw] md:w-1/2 lg:w-[30dvw] h-dvh fixed top-0 inset-e-0 flex flex-col justify-start items-start gap-4 p-4 md:gap-4 md:p-4 md:py-8 font-secondary transition-default ${
                ui.isCartOpen ? "translate-x-0" : "ltr:translate-x-full rtl:-translate-x-full"
            }`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex justify-between items-center w-full h-fit">
                <h4 className="title6 md:title5! lg:title4">{t("heading")}</h4>
                <button aria-label={"close"} type="button" className="button2 p-1" onClick={() => dispatch({ type: "CLOSE_CART" })}>
                    <Cross classnames={"w-10 lg:w-14"} />
                </button>
            </div>

            {cart.length ? (
                <>
                    <div className="flex flex-col justify-start items-center gap-4 w-full h-9/10 md:h-4/5 font-secondary text-primary overflow-y-auto">
                        {cart.map((i) => (
                            <div className="flex-center w-full gap-4" key={i.slug}>
                                <div className="relative w-1/4 aspect-square">
                                    <Image src={i.images[0]} alt={i.slug} sizes="(max-width: 20dvw) 20vw, 30dvw" className="object-cover object-center select-none" fill></Image>
                                </div>
                                <div className="w-3/4 h-full flex flex-col justify-between">
                                    <div>
                                        <p className="title4 sm:title5 capitalize text-shine">{i.brand}</p>
                                        <p className="text-base sm:title6 capitalize">{i.model}</p>
                                    </div>
                                    <p className="title6 sm:title5 md:title-base lg:title6 font-sans">
                                        {i.quantity} x {format_price(i.price, currency)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex flex-wrap justify-between items-center gap-4 w-full h-fit">
                        <div className="flex justify-between items-center w-full font-sans">
                            <p className="sm:title5 title6">{t("subtotal")}</p>
                            <p className="sm:title5 title6">{format_price(subtotal, currency)}</p>
                        </div>
                        <Link aria-label={t("viewCart")} onClick={() => dispatch({ type: "CLOSE_CART" })} className="w-full button px-2 py-4 md:p-auto flex-center title6" href="/cart">
                            {t("viewCart")}
                        </Link>
                        <Link aria-label={t("checkoutCta")} onClick={() => dispatch({ type: "CLOSE_CART" })} className="w-full button px-2 py-4 md:p-auto flex-center title6" href="/checkout">
                            {t("checkoutCta")}
                        </Link>
                    </div>
                </>
            ) : (
                <div className="flex-center flex-col gap-4 w-full h-9/10 md:h-4/5 font-sans text-parimary">
                    <Info classnames={"w-18"} />
                    <h5 className="title5 flex-center text-center">{t("empty")}</h5>
                </div>
            )}
        </div>
    );
}
