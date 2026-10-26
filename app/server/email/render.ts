import "server-only";

/** Escape anything that ends up in email HTML (names, messages, product titles…). */
export function esc(value: unknown): string {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export type Block = { kind: "p"; text: string } | { kind: "rows"; title?: string; rows: [string, string][] } | { kind: "button"; label: string; href: string } | { kind: "images"; urls: string[] };

const GOLD = "#bf953f";

/** Plain, table-based layout that renders in every mail client; black header with the gold store name. */
export function render_email({ store, heading, blocks, footer, dir = "ltr" }: { store: string; heading: string; blocks: Block[]; footer: string; dir?: "ltr" | "rtl" }): { html: string; text: string } {
    const align = dir == "rtl" ? "right" : "left";

    const html_blocks = blocks
        .map((b) => {
            switch (b.kind) {
                case "p":
                    return `<p style="margin:0 0 16px;line-height:1.6;white-space:pre-line">${esc(b.text)}</p>`;
                case "rows":
                    return `${b.title ? `<p style="margin:24px 0 8px;font-weight:bold;color:${GOLD}">${esc(b.title)}</p>` : ""}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px">${b.rows
                        .map(([k, v]) => `<tr><td style="padding:6px 0;border-bottom:1px solid #eee;color:#555">${esc(k)}</td><td style="padding:6px 0;border-bottom:1px solid #eee;text-align:${dir == "rtl" ? "left" : "right"}">${esc(v)}</td></tr>`)
                        .join("")}</table>`;
                case "button":
                    return `<p style="margin:24px 0"><a href="${esc(b.href)}" style="display:inline-block;background:${GOLD};color:#000;text-decoration:none;padding:12px 20px;font-weight:bold">${esc(b.label)}</a></p>`;
                case "images":
                    return `<p style="margin:0 0 16px">${b.urls.map((u, i) => `<a href="${esc(u)}" style="color:${GOLD}">Photo ${i + 1}</a>`).join(" · ")}</p>`;
            }
        })
        .join("");

    const html = `<!doctype html><html dir="${dir}"><body style="margin:0;background:#f4f4f4;font-family:Georgia,'Times New Roman',serif;color:#111">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;text-align:${align}">
<tr><td style="background:#000;padding:24px 32px;color:${GOLD};font-size:24px;letter-spacing:4px;text-transform:uppercase">${esc(store)}</td></tr>
<tr><td style="padding:32px;font-size:15px"><h1 style="margin:0 0 20px;font-size:22px;font-weight:normal">${esc(heading)}</h1>${html_blocks}</td></tr>
<tr><td style="padding:16px 32px;background:#fafafa;color:#888;font-size:12px;font-family:Arial,sans-serif">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;

    const text = [
        heading,
        "",
        ...blocks.map((b) => {
            switch (b.kind) {
                case "p":
                    return b.text + "\n";
                case "rows":
                    return (b.title ? `${b.title}\n` : "") + b.rows.map(([k, v]) => `${k}: ${v}`).join("\n") + "\n";
                case "button":
                    return `${b.label}: ${b.href}\n`;
                case "images":
                    return b.urls.join("\n") + "\n";
            }
        }),
        "--",
        footer,
    ].join("\n");

    return { html, text };
}
