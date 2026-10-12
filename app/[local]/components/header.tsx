"use client";
import dynamic from "next/dynamic";

import { Watch } from "@/types/watch";
import { Locales } from "@/types/locales";

import { Dispatch, SetStateAction, useEffect, useReducer, useRef, useState } from "react";
import Link from "next/link";

import Image from "next/image";
import MenuBurger from "./svg/menu_burger";
import Cart from "./svg/cart";

import increase_relevance_score from "@/app/server/increase_relevance_score";
import score_rewards from "../(site)/lib/relevance_score";

import { useAuth } from "../(site)/context/authContext";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/routing";

import Credits from "./credits";
import Select from "./elements/select";
import Search_input from "./elements/search_input";
import { ThemeToggle } from "./theme";
import { format_price } from "../(site)/lib/price_format";
import { Supported_Currencies } from "@/currency";
import setCurrency from "@/app/server/set_currency";

const CartDrawer = dynamic(() => import("./cart_drawer"), {
    ssr: false,
});
const Nav = dynamic(() => import("./nav"), {
    ssr: false,
});

const GESTURE_LOCK = 15;
const SWIPE_THRESHOLD = 80;

function swipe_guard(target: EventTarget | null): { blocked: boolean; scroller: HTMLElement | null } {
    let el = target instanceof Element ? (target as HTMLElement) : null;

    while (el && el !== document.body) {
        if (el.hasAttribute("data-no-swipe")) return { blocked: true, scroller: null };

        const style = getComputedStyle(el);

        const touch = style.touchAction;
        if (touch.includes("none") || touch.includes("pan-y")) return { blocked: true, scroller: null };

        const overflow_x = style.overflowX;
        if ((overflow_x === "auto" || overflow_x === "scroll") && el.scrollWidth - el.clientWidth > 1) {
            return { blocked: false, scroller: el };
        }

        el = el.parentElement;
    }

    return { blocked: false, scroller: null };
}

function can_scroll(el: HTMLElement, deltaX: number): boolean {
    const max = el.scrollWidth - el.clientWidth;

    if (deltaX > 0) return el.scrollLeft > 1;

    return el.scrollLeft < max - 1;
}

type UIState = {
    isNavOpen: boolean;
    isCartOpen: boolean;
    isGlassy: boolean;
};

type UIAction = { type: "OPEN_NAV" } | { type: "CLOSE_NAV" } | { type: "OPEN_CART" } | { type: "CLOSE_CART" } | { type: "TOGGLE_LANG" } | { type: "SET_GLASSY"; payload: boolean };

const initialUIState: UIState = {
    isNavOpen: false,
    isCartOpen: false,
    isGlassy: true,
};

const locales_map = new Map<string, Locales>([
    ["English", "en"],
    ["Deutsch", "de"],
    ["French", "fr"],
    ["Italian", "it"],
    ["Turkish", "tr"],
    ["Spanish", "es"],
    ["Arabic", "ar"],

    ["en", "en"],
    ["de", "de"],
    ["fr", "fr"],
    ["it", "it"],
    ["tr", "tr"],
    ["es", "es"],
    ["ar", "ar"],
]);

const currencies_options = new Map<string, Supported_Currencies>([
    ["USD (US Dollar)", "USD"],
    ["CAD (Canadian Dollar)", "CAD"],
    ["AUD (Australian Dollar)", "AUD"],
    ["GBP (British Pound)", "GBP"],
    ["EUR (Euro)", "EUR"],
    ["CHF (Swiss Franc)", "CHF"],
    ["HKD (Hong Kong Dollar)", "HKD"],
    ["JPY (Japanese Yen)", "JPY"],
    ["SGD (Singapore Dollar)", "SGD"],
    ["CNY (Chinese Yuan)", "CNY"],
]);
const currencies_map = new Map<string, Supported_Currencies>([
    ["USD (US Dollar)", "USD"],
    ["CAD (Canadian Dollar)", "CAD"],
    ["AUD (Australian Dollar)", "AUD"],
    ["GBP (British Pound)", "GBP"],
    ["EUR (Euro)", "EUR"],
    // ["SAR (Saudi Riyal)", "SAR"],
    // ["AED (UAE Dirham)", "AED"],
    // ["QAR (Qatari Riyal)", "QAR"],
    // ["KWD (Kuwaiti Dinar)", "KWD"],
    // ["BHD (Bahraini Dinar)", "BHD"],
    ["CHF (Swiss Franc)", "CHF"],
    ["HKD (Hong Kong Dollar)", "HKD"],
    ["JPY (Japanese Yen)", "JPY"],
    ["SGD (Singapore Dollar)", "SGD"],
    ["CNY (Chinese Yuan)", "CNY"],

    ["USD", "USD"],
    ["CAD", "CAD"],
    ["AUD", "AUD"],
    ["GBP", "GBP"],
    ["EUR", "EUR"],
    // ["SAR", "SAR"],
    // ["AED", "AED"],
    // ["QAR", "QAR"],
    // ["KWD", "KWD"],
    // ["BHD", "BHD"],
    ["CHF", "CHF"],
    ["HKD", "HKD"],
    ["JPY", "JPY"],
    ["SGD", "SGD"],
    ["CNY", "CNY"],
]);

function headerReducer(state: UIState, action: UIAction): UIState {
    switch (action.type) {
        case "OPEN_NAV":
            window.innerWidth < 640 && (document.body.style.overflowY = "clip");
            return { ...state, isNavOpen: true, isCartOpen: false };
        case "CLOSE_NAV":
            window.innerWidth < 640 && (document.body.style.overflowY = "auto");
            return { ...state, isNavOpen: false };
        case "OPEN_CART":
            window.innerWidth < 640 && (document.body.style.overflowY = "clip");
            return { ...state, isCartOpen: true, isNavOpen: false };
        case "CLOSE_CART":
            window.innerWidth < 640 && (document.body.style.overflowY = "auto");
            return { ...state, isCartOpen: false };
        case "SET_GLASSY":
            if (state.isGlassy === action.payload) return state;
            return { ...state, isGlassy: action.payload };
        default:
            return state;
    }
}

export default function Header({ savedCurrency = "USD" }: { savedCurrency: Supported_Currencies }) {
    const { session } = useAuth();
    const locale = useLocale() as Locales;
    const t = useTranslations("common");

    const [lang, set_lang] = useState<Locales>(locale);

    const selected_locale = locales_map.get(lang)!.toUpperCase();

    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        router.replace(pathname, { locale: selected_locale });
    }, [lang]);

    const [currency, set_currency] = useState<Supported_Currencies>(savedCurrency);

    useEffect(() => {
        setCurrency(currencies_map.get(currency)!);
    }, [currency]);


    const [ui, dispatch] = useReducer(headerReducer, initialUIState);
    const cartRef = useRef<HTMLDivElement>(null);
    const navRef = useRef<HTMLElement>(null);

    useEffect(() => {
        let release: (() => void) | null = null;

        const onTouchStart = (e: TouchEvent) => {
            if (e.touches.length > 1) return;

            const cartEl = cartRef.current;
            const navEl = navRef.current;
            if (!cartEl || !navEl) return;

            const { blocked, scroller } = swipe_guard(e.target);
            if (blocked) return;

            const startX = e.touches[0].clientX;
            const startY = e.touches[0].clientY;

            let gesture: "horizontal" | "vertical" | "native" | null = null;

            cartEl.style.transition = "50ms ease";
            navEl.style.transition = "50ms ease";

            const handleMove = (moveEvent: TouchEvent) => {
                if (moveEvent.touches.length > 1) {
                    gesture = "native";
                    return;
                }

                const currentX = moveEvent.touches[0].clientX;
                const currentY = moveEvent.touches[0].clientY;

                const deltaX = currentX - startX;
                const deltaY = currentY - startY;

                if (gesture === null) {
                    if (Math.abs(deltaX) < GESTURE_LOCK && Math.abs(deltaY) < GESTURE_LOCK) return;

                    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                        if (scroller && can_scroll(scroller, deltaX)) {
                            gesture = "native";
                            return;
                        }

                        gesture = "horizontal";
                    } else {
                        gesture = "vertical";
                    }
                }

                if (gesture !== "horizontal") return;

                if (moveEvent.cancelable) {
                    moveEvent.preventDefault();
                }

                if (ui.isCartOpen) {
                    if (deltaX > 0) {
                        cartEl.style.transform = `translateX(${deltaX}px)`;
                    }
                } else {
                    if (ui.isNavOpen) {
                        if (deltaX < 0) {
                            navEl.style.transform = `translateX(${deltaX}px)`;
                        }
                    } else {
                        if (deltaX < 0) {
                            cartEl.style.transform = `translateX(${deltaX}px)`;
                        } else {
                            navEl.style.transform = `translateX(${deltaX}px)`;
                        }
                    }
                }
            };

            const reset = () => {
                window.removeEventListener("touchmove", handleMove);
                window.removeEventListener("touchend", handleEnd);
                window.removeEventListener("touchcancel", handleCancel);
                release = null;

                cartEl.style.transition = "";
                cartEl.style.transform = "";

                navEl.style.transition = "";
                navEl.style.transform = "";
            };

            const handleCancel = () => reset();

            const handleEnd = (endEvent: TouchEvent) => {
                const settled = gesture;
                reset();

                if (settled !== "horizontal") return;

                const finalDeltaX = endEvent.changedTouches[0].clientX - startX;

                if (ui.isCartOpen) {
                    if (finalDeltaX > SWIPE_THRESHOLD) dispatch({ type: "CLOSE_CART" });
                } else if (ui.isNavOpen) {
                    if (finalDeltaX < -SWIPE_THRESHOLD) dispatch({ type: "CLOSE_NAV" });
                } else {
                    if (finalDeltaX < -SWIPE_THRESHOLD) dispatch({ type: "OPEN_CART" });
                    else if (finalDeltaX > SWIPE_THRESHOLD) dispatch({ type: "OPEN_NAV" });
                }
            };

            release = reset;

            window.addEventListener("touchmove", handleMove, { passive: false });
            window.addEventListener("touchend", handleEnd);
            window.addEventListener("touchcancel", handleCancel);
        };

        window.addEventListener("touchstart", onTouchStart, { passive: true });

        return () => {
            window.removeEventListener("touchstart", onTouchStart);
            release?.();
        };
    }, [ui.isCartOpen, ui.isNavOpen]);

    return (
        <>
            <header className={`flex flex-col w-dvw fixed top-0 inset-s-0 z-4000 h-fit min-h-20 text-primary bg-background`}>
                <Credits />
                <div className="w-full flex justify-between items-center sm:px-8 py-4 sm:py-2 px-[5dvw]">
                    <div className={`w-1/3 flex justify-between items-center transition-default ${ui.isNavOpen ? "opacity-0" : "opacity-100"} gap-2`}>
                        <button aria-label={"menu"} type="button" className="button2 p-1 md:p-auto" onClick={() => dispatch({ type: "OPEN_NAV" })}>
                            <MenuBurger classnames="w-5 sm:w-8" clr={"currentColor"} />
                        </button>
                        <div className="xl:hidden block">
                            <Search_input placeholder={t("filters.searchPlaceholder")} route="/api/search_watches" SearchChildComponent={SearchChildComponent} SearchChildLoader={SearchChildLoader} />
                        </div>
                    </div>

                    <div className="w-1/3 flex-center">
                        <Link aria-label={"home"} href={"/"} className="relative aspect-square sm:aspect-video w-8 sm:w-25">
                            <Image src={"/logo_dark.png"} sizes="(max-width: 768px) 175px, 200px" alt="Arvell" fill className={`object-cover object-center dark:brightness-100 brightness-0 hidden sm:block `} />
                            <Image src={"/logo_dark_compact.png"} sizes="100px" alt="Arvell" fill className={`object-cover object-center dark:brightness-100 brightness-0 sm:hidden `} />
                        </Link>
                    </div>

                    <div className="flex justify-end items-center gap-2 w-1/3">
                        <div className="xl:block hidden">
                            <Search_input placeholder={t("filters.searchPlaceholder")} route="/api/search_watches" SearchChildComponent={SearchChildComponent} SearchChildLoader={SearchChildLoader} />
                        </div>

                        {!session?.email && (
                            <Link aria-label={t("buttons.register")} className={`button2 hidden md:block hover:text-primary capitalize`} href={"/auth/sign_up"}>
                                {t("buttons.register")}
                            </Link>
                        )}

                        <Select classnames="flex text-sm sm:text-base" options={["English", "Arabic", "Spanish", "Deutsch", "French", "Italian", "Turkish"]} value={selected_locale} set_value={set_lang as Dispatch<SetStateAction<string>>} />

                        <Select classnames="hidden sm:flex text-sm sm:text-base" options={currencies_options.keys().toArray()} value={currencies_map.get(currency)!} set_value={set_currency as Dispatch<SetStateAction<string>>} />

                        <button aria-label={"cart"} type="button" onClick={() => dispatch({ type: "OPEN_CART" })} className={`button2 p-1 sm:p-2 relative ${ui.isGlassy ? "" : "hover:text-primary"}`}>
                            <Cart clr={"currentColor"} classnames="w-5 sm:w-6" />
                            {session && session.cart.length ? <p className="absolute inset-s-1/2 top-1/2 text-[10px] flex-center p-1 bg-foreground text-background aspect-square rounded-full w-4 h-4">{session.cart.length}</p> : <></>}
                        </button>
                        <div className="sm:block hidden">
                            <ThemeToggle />
                        </div>
                    </div>
                </div>
                <Nav savedCurrency={savedCurrency} ref={navRef} ui={ui} dispatch={dispatch} />
                <CartDrawer ref={cartRef} ui={ui} dispatch={dispatch} />
            </header>
        </>
    );
}

function SearchChildComponent({ item }: { item: Watch }) {
    return (
        <Link
            href={"/product/" + item.slug}
            onClick={async () => await increase_relevance_score(item.slug, score_rewards.search)}
            className="flex justify-between items-center w-full h-full text-sm capitalize gap-2 bg-transparent hover:bg-primary border-b sm:border-0 cursor-pointer transition-default p-2"
        >
            <div className="relative min-w-15 aspect-square">
                <Image src={item.images[0]} alt={item.brand + " " + item.model} fill sizes="(max-width: 768px) 150px, 100px" />
            </div>
            <div className="w-full h-full flex flex-col justify-start items-start gap-2">
                <p className="w-full">{item.brand + " " + item.model + " " + (item.year || "") + " Ref. " + item.reference}</p>
                <p>{format_price(item.price)}</p>
            </div>
        </Link>
    );
}
function SearchChildLoader() {
    return (
        <div className="flex justify-between items-center w-full h-full gap-2 border-b sm:border-0 p-2">
            <div className="relative min-w-15 aspect-square loading"></div>
            <div className="w-full h-full flex flex-col justify-start items-start gap-2">
                <div className="w-full h-5 loading"></div>
                <div className="w-30 h-5 loading"></div>
            </div>
        </div>
    );
}
