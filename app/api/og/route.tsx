import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { DEMO_MODE } from "@/app/(site)/lib/demo";
import { get_settings } from "@/app/server/settings";
import { sanitizeRef } from "@/i18n/brand";

/*
 * The social share image (og:image / Twitter card), 1200×630. Shows the store name, or on the demo the
 * dealer from ?ref=: link-preview bots never get the ref cookie, so the name has to come from the URL.
 */

const GOLD = "#bf953f";

// A frame of the hero video. Read from disk: ImageResponse refuses to fetch from the site's own (local) address.
const background = readFile(join(process.cwd(), "app/api/og/watch.jpg")).then((file) => `data:image/jpeg;base64,${file.toString("base64")}`);

/** Cormorant Garamond (the site's display face) for just these letters; null falls back to the default font. */
async function display_font(text: string): Promise<ArrayBuffer | null> {
    try {
        const css = await (await fetch(`https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500&text=${encodeURIComponent(text)}`)).text();
        const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
        return url ? await (await fetch(url)).arrayBuffer() : null;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const ref = DEMO_MODE ? sanitizeRef(new URL(request.url).searchParams.get("ref")) : null;
    const name = (ref ?? (await get_settings()).store_name).toUpperCase();
    const tagline = "LUXURY WATCHES";

    const [font, watch] = await Promise.all([display_font(name + tagline), background]);

    return new ImageResponse(
        (
            <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", background: "#000", color: "#fff" }}>
                {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse, not the browser */}
                <img src={watch} width={1120} height={630} alt="" style={{ position: "absolute", top: 0, left: 300 }} />
                <div style={{ position: "absolute", top: 0, left: 0, width: 1200, height: 630, display: "flex", backgroundImage: "linear-gradient(90deg, #000 0%, #000 32%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0) 80%)" }} />

                <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 80px", width: 760, gap: 28 }}>
                    <div style={{ fontSize: name.length > 14 ? 64 : 88, letterSpacing: "0.12em", color: GOLD, fontFamily: font ? "Display" : undefined, lineHeight: 1.1 }}>{name}</div>
                    <div style={{ width: 120, height: 2, background: GOLD }} />
                    <div style={{ fontSize: 34, letterSpacing: "0.3em", color: "#e8e1d4", fontFamily: font ? "Display" : undefined }}>{tagline}</div>
                </div>
            </div>
        ),
        {
            width: 1200,
            height: 630,
            fonts: font ? [{ name: "Display", data: font, weight: 500, style: "normal" }] : undefined,
            headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
        },
    );
}
