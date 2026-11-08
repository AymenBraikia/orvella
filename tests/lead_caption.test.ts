import { describe, expect, it } from "vitest";
import { parse_caption } from "../scripts/lead_demo/caption";

/* scripts/build-lead-demo.ts reads sellers' Instagram captions: real ones (Star Watches, Mumbai). */

describe("parse_caption", () => {
    it("reads a full Rolex caption", () => {
        const p = parse_caption(`🤩💚⚡️‼️

ROLEX SUBMARINER DATE 41MM "STARBUCKS" – BLACK DIAL – GREEN CERACHROM BEZEL

FULL SET – 2023

THE ICONIC ROLEX SUBMARINER "STARBUCKS" FEATURING A STUNNING BLACK DIAL PAIRED WITH THE SIGNATURE GREEN CERACHROM BEZEL.

REF. NO.:- 126610LV

FULL SET – WITH BOX & WARRANTY CARD (2023)

CONDITION:- 9.5/10 (SUPER MINT)
COMES WITH BOTH ORIGINAL TAGS

SIZE:- 41MM

DM FOR PRICE!!!

📍 MUMBAI`);
        expect(p).toMatchObject({ brand: "rolex", family: "Submariner Date", collection: "diver", nickname: "Starbucks", reference: "126610LV", size_mm: 41, year: 2023, dial: "Black", box: true, papers: true, condition_score: 9.5, city: "Mumbai" });
        expect(p.price).toBeUndefined();
        expect(p.extras).toContain("both original tags");
        expect(p.sentences).toHaveLength(1);
    });

    it("reads an Indian price, the retail price, box-only and a WhatsApp number", () => {
        const p = parse_caption(`OMEGA CONSTELLATION 35mm STEEL AUTOMATIC
CONDITION :- 9/10
MOVEMENT:-CO-AXIAL 2500
REF. NO. :- 123.10.35.20.02.001
ONLY WATCH & BOX !! NO CARD!!
MRP:- 4,03,600/-
PRICE:- 1,75,000/- SLIGHTLY NEGOTIABLE
Personal whatsapp:-
wa.me/+917718929979`);
        expect(p).toMatchObject({ brand: "omega", family: "Constellation", reference: "123.10.35.20.02.001", material: "Stainless Steel", movement: "Automatic", box: true, papers: false, whatsapp: "917718929979" });
        expect(p.price).toEqual({ amount: 175000, currency: "INR" });
        expect(p.retail).toEqual({ amount: 403600, currency: "INR" });
    });

    it("does not take a gold case for the dial colour, and reads two-tone without '&'", () => {
        const zombie = parse_caption(`ROLEX ZOMBIE
GMT MASTER II - 40MM STEEL & GOLD. DATED 2024
REF:-126713GRNR`);
        expect(zombie).toMatchObject({ family: "GMT-Master II", nickname: "Zombie", material: "Steel & Gold", year: 2024 });
        expect(zombie.dial).toBeUndefined();
        expect(parse_caption("ROLEX SKY DWELLER 42MM 2022 FULL SET - STEEL GOLD BLACK DIAL").material).toBe("Steel & Gold");
    });
});
