import { after, NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyJwt } from "@/app/(auth)/auth/jwt";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { invalidate_items } from "@/app/server/inventory";
import { demo_item_slugs, find_demo, is_counted_visit, is_person, mark_demo_fresh, record_demo_view } from "@/app/server/private_demos";

const MONTH = 60 * 60 * 24 * 30;
const NO_INDEX = { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "private, no-store" };

/**
 * corlane.store/<slug> (rewritten here by proxy.ts): opens a private demo as the real storefront.
 * The visitor gets the seller's name as their ?ref= (the store shows that name and only the
 * seller's pieces) and the demo's currency, then lands on the store's home page. Link-preview bots
 * keep no cookies, so they get ?ref= in the URL instead, which the home page's metadata reads.
 */
export async function GET(request: NextRequest, ctx: RouteContext<"/api/demo-open/[slug]">): Promise<Response> {
    // Demos belong to the Corlane demo site; a dealer's own shop ignores ?ref= altogether.
    const demo = DEMO_MODE ? await find_demo((await ctx.params).slug) : null;
    if (!demo) return new Response("Page not found", { status: 404, headers: { ...NO_INDEX, "Content-Type": "text/plain; charset=utf-8" } });

    // Pieces saved by the CLI script are not in the store's caches yet.
    if (demo.stale) {
        invalidate_items(await demo_item_slugs(demo.id));
        revalidatePath("/", "layout");
        await mark_demo_fresh(demo.id);
    }

    const token = request.cookies.get("accessToken")?.value;
    const is_admin = Boolean(token && verifyJwt(token)?.admin);
    if (is_counted_visit(request.headers, is_admin)) after(() => record_demo_view(demo.id).catch((error) => console.error("could not count demo view", error)));

    const target = new URL(`/${demo.language}`, request.url);
    if (!is_person(request.headers)) target.searchParams.set("ref", demo.name);

    const response = NextResponse.redirect(target, { status: 307, headers: NO_INDEX });
    response.cookies.set("ref", demo.name, { path: "/", maxAge: MONTH, sameSite: "lax" });
    response.cookies.set("Currency", demo.currency, { path: "/", maxAge: MONTH, sameSite: "lax" });
    return response;
}
