/**
 * Find broken internal links.
 *
 *   npm run check-links -- http://localhost:3000
 *
 * Reads /sitemap.xml, loads every page in it, collects every internal link on those pages and
 * checks each one (redirects are followed). Prints the links that do not end in a 2xx response,
 * with the pages that link to them. Exit code 1 if anything is broken.
 */

export {};

const base = (process.argv[2] ?? "http://localhost:3000").replace(/\/+$/, "");
const CONCURRENCY = 4;

async function get(url: string): Promise<{ status: number; html: string }> {
    try {
        const res = await fetch(url, { headers: { Cookie: "NEXT_LOCALE=en" }, redirect: "follow" });
        const type = res.headers.get("content-type") ?? "";
        return { status: res.status, html: type.includes("text/html") ? await res.text() : "" };
    } catch {
        return { status: 0, html: "" };
    }
}

/** Every same-site href on the page, without query strings and #anchors. */
function internal_links(html: string): string[] {
    const links = new Set<string>();
    for (const [, href] of html.matchAll(/href="([^"]+)"/g)) {
        if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/_next") || /\.(css|js|png|jpe?g|webp|avif|svg|ico|mp4|woff2?)$/.test(href)) continue;
        links.add(href.replace(/&amp;/g, "&").split("#")[0].split("?")[0] || "/");
    }
    return [...links];
}

async function pool<T>(items: T[], worker: (item: T) => Promise<void>) {
    const queue = [...items];
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
        for (let next = queue.shift(); next !== undefined; next = queue.shift()) await worker(next);
    }));
}

const sitemap = await get(`${base}/sitemap.xml`);
if (sitemap.status !== 200) {
    console.error(`Could not load ${base}/sitemap.xml (status ${sitemap.status}). Is the site running?`);
    process.exit(1);
}

// The sitemap uses the deployment's public URL; check the pages on the base given here.
const all_pages = [...(await (await fetch(`${base}/sitemap.xml`)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, loc]) => new URL(loc).pathname);

console.log(`Checking ${all_pages.length} sitemap pages on ${base} …`);

const linked_from = new Map<string, Set<string>>();
const status = new Map<string, number>();

await pool(all_pages, async (path) => {
    const page = await get(base + path);
    status.set(path, page.status);
    for (const link of internal_links(page.html)) {
        if (!linked_from.has(link)) linked_from.set(link, new Set());
        linked_from.get(link)!.add(path);
    }
});

const to_check = [...linked_from.keys()].filter((link) => !status.has(link));
console.log(`Checking ${to_check.length} more linked URLs …`);
await pool(to_check, async (link) => {
    status.set(link, (await get(base + link)).status);
});

const broken = [...status.entries()].filter(([, s]) => s < 200 || s >= 300).sort(([a], [b]) => a.localeCompare(b));

if (!broken.length) {
    console.log(`✓ No broken links (${status.size} URLs checked).`);
} else {
    for (const [url, s] of broken) {
        const from = [...(linked_from.get(url) ?? [])].slice(0, 3);
        console.log(`✗ ${s} ${url}${from.length ? `  ← linked from ${from.join(", ")}` : "  (in sitemap)"}`);
    }
    console.log(`${broken.length} broken of ${status.size} URLs checked.`);
    process.exitCode = 1;
}
