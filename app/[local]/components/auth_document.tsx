import { NextIntlClientProvider } from "next-intl";
import { client_messages } from "@/i18n/client_messages";
import { ThemeProvider } from "@/app/(site)/context/ThemeProvider";
import { StorefrontProvider } from "@/app/(site)/context/storefrontContext";
import { MAIN_STOREFRONT, type Storefront } from "@/app/(site)/lib/storefront";
import { getDirection } from "@/i18n/direction";
import "../globals.css";

/**
 * The sign-in / sign-up pages' document (no store header or footer). Shared by the store's auth
 * layout and the lead demos' (`store`: the demo, so the pages' links stay in it).
 */
export default async function AuthDocument({ local, fonts, store = MAIN_STOREFRONT, children }: { local: string; fonts: string; store?: Storefront; children: React.ReactNode }) {
    const direction = getDirection(local);

    return (
        <html lang={local} dir={direction} className={`${fonts} h-full antialiased`} suppressHydrationWarning>
            <body className="font-sans">
                <NextIntlClientProvider messages={await client_messages(["auth", "home", "common"])}>
                    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                        <StorefrontProvider store={store}>
                            <div className="min-h-full flex-center flex-col max-w-dvw overflow-x-hidden p-4">{children}</div>
                        </StorefrontProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
