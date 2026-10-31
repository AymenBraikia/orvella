import { beforeEach, describe, expect, it, vi } from "vitest";

/*
 * Checkout saves go through updateUser. It reports a refused save only as `false`, which the form
 * can't show, so one rejected field used to mean nothing was saved and the pay button stayed off.
 */

const updateOne = vi.hoisted(() => vi.fn(async () => ({ acknowledged: true })));

vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("../app/server/cart", () => ({ cart_target: async () => ({ collection: { updateOne }, filter: { _id: "cart" }, guest: true, id: "cart" }) }));

const { default: updateUser } = await import("@/app/server/update_user");

const saved = () => (updateOne.mock.calls[0] as unknown as [unknown, { $set: Record<string, never> }])[1].$set;

beforeEach(() => {
    updateOne.mockClear();
});

describe("saving checkout details", () => {
    it("accepts address fields that came back from the database as null", async () => {
        const address = { country: "Germany", address1: "Hauptstraße 1", address2: null, postCode: "80331", city: "München", phone: null };

        expect(await updateUser({ address })).toBe(true);
        expect(saved().address).toMatchObject({ address1: "Hauptstraße 1", city: "München" });
    });

    it("saves everything autofill entered in one go", async () => {
        expect(await updateUser({ firstName: "Anna", lastName: "Muster", email: "ANNA@example.com" })).toBe(true);
        expect(saved()).toMatchObject({ firstName: "Anna", lastName: "Muster", email: "anna@example.com" });
    });

    it("still refuses a malformed email and writes nothing", async () => {
        expect(await updateUser({ email: "anna@" })).toBe(false);
        expect(updateOne).not.toHaveBeenCalled();
    });

    it("never takes fields a customer may not change", async () => {
        await updateUser({ firstName: "Anna", admin: true, cart: [] } as never);
        expect(Object.keys(saved())).toEqual(expect.not.arrayContaining(["admin", "cart"]));
    });
});
