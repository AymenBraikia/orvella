import { createNavigation } from "next-intl/navigation";
import { defineRouting } from "next-intl/routing";
import { LOCALES } from "./locales";

export const routing = defineRouting({
    locales: LOCALES,
    defaultLocale: "en",
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
