import { get_admin } from "@/app/server/admin_auth";
import { read_demo_photo } from "@/app/server/private_demos";

const NOT_FOUND = () => new Response("Not found", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });

/** A private-demo photo. Only while its demo is live; the admin also sees photos of disabled demos. */
export async function GET(_request: Request, ctx: RouteContext<"/api/demo-photos/[id]">): Promise<Response> {
    const found = await read_demo_photo((await ctx.params).id);
    if (!found || (!found.live && !(await get_admin()))) return NOT_FOUND();

    return new Response(new Uint8Array(found.photo.data.buffer), {
        headers: {
            "Content-Type": found.photo.content_type,
            "Content-Length": String(found.photo.size),
            // Browser cache only: once a demo is disabled or deleted, its photos stop being served.
            "Cache-Control": "private, max-age=86400",
            "X-Content-Type-Options": "nosniff",
            "X-Robots-Tag": "noindex, nofollow",
        },
    });
}
