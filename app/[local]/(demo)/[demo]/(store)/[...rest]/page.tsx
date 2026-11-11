import { notFound } from "next/navigation";
import type { Metadata } from "next";
import InfoLayout from "@/app/(site)/info/layout";
import { store_has } from "@/app/(site)/lib/storefront";
import { current_storefront, demo_metadata, enter_demo, require_demo } from "@/app/server/storefront";

/*
 * The store's other pages inside a lead demo (/<locale>/<demo>/<page>): the same page components,
 * showing the demo's identity and stock. Pages a demo does not have (the stock it does not carry)
 * and unknown addresses are the 404, still inside the demo. The sign-in pages are in (account).
 */

type PageProps_ = { params: Promise<{ local: string }>; searchParams: Promise<Record<string, string>> };
type PageModule = { default: (props: PageProps_) => React.ReactNode | Promise<React.ReactNode>; generateMetadata?: (props: { params: Promise<{ local: string }> }) => Promise<Metadata> };

const PAGES: Record<string, () => Promise<PageModule>> = {
    watches: () => import("@/app/(site)/watches/page"),
    cart: () => import("@/app/(site)/cart/page"),
    checkout: () => import("@/app/(site)/checkout/page"),
    thank_you: () => import("@/app/(site)/thank_you/page"),
    sell: () => import("@/app/(site)/sell/page"),
    polish: () => import("@/app/(site)/polish/page"),
    store: () => import("@/app/(site)/store/page"),
    booking: () => import("@/app/(site)/booking/page"),
    consultation: () => import("@/app/(site)/consultation/page"),
    "info/about": () => import("@/app/(site)/info/about/page"),
    "info/cookies": () => import("@/app/(site)/info/cookies/page"),
    "info/disclaimer": () => import("@/app/(site)/info/disclaimer/page"),
    "info/faq": () => import("@/app/(site)/info/faq/page"),
    "info/imprint": () => import("@/app/(site)/info/imprint/page"),
    "info/payments": () => import("@/app/(site)/info/payments/page"),
    "info/policy": () => import("@/app/(site)/info/policy/page"),
    "info/terms": () => import("@/app/(site)/info/terms/page"),
    "info/vacancies": () => import("@/app/(site)/info/vacancies/page"),
    "info/withdraw": () => import("@/app/(site)/info/withdraw/page"),
};

/** The store page at this address, if the demo has it. */
function page_of(rest: string[]): (() => Promise<PageModule>) | null {
    const path = rest.join("/");
    return PAGES[path] && store_has(current_storefront(), `/${path}`) ? PAGES[path] : null;
}

export async function generateMetadata({ params }: PageProps<"/[local]/[demo]/[...rest]">): Promise<Metadata> {
    const { rest, local } = await params;
    const demo = await require_demo(params, `/${rest.join("/")}`);
    const load = page_of(rest);
    const own = load ? await (await load()).generateMetadata?.({ params: Promise.resolve({ local }) }) : undefined;
    const title = typeof own?.title == "string" ? own.title : undefined;
    return demo_metadata(demo, title ? { title, description: typeof own?.description == "string" ? own.description : demo.description } : undefined);
}

export default async function DemoPage({ params, searchParams }: PageProps<"/[local]/[demo]/[...rest]">) {
    const { rest, local } = await params;
    await enter_demo(params, `/${rest.join("/")}`);
    const load = page_of(rest);
    if (!load) notFound();

    const Page = (await load()).default;
    const page = <Page params={Promise.resolve({ local })} searchParams={searchParams as Promise<Record<string, string>>} />;
    return rest[0] == "info" ? <InfoLayout>{page}</InfoLayout> : page;
}
