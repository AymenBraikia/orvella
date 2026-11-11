import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/*
 * On a dealer's shop the developer's name must appear nowhere a customer can see. Only the demo
 * banner and the /why pitch may carry it, and those two namespaces stay demo-only.
 */

const PERSONAL = /\baymen\b|braikia|ayme\.n0412/i;
const DEMO_ONLY = ["demo", "why"];

describe("personal name in the translations", () => {
    for (const file of readdirSync("messages")) {
        it(`${file}: only in the demo-only namespaces`, () => {
            const messages = JSON.parse(readFileSync(`messages/${file}`, "utf8")) as Record<string, unknown>;
            const found = Object.entries(messages).filter(([ns, value]) => !DEMO_ONLY.includes(ns) && PERSONAL.test(JSON.stringify(value)));
            expect(found.map(([ns]) => ns)).toEqual([]);
        });
    }
});
