import { describe, expect, it } from "vitest";
import { createOrderSchema } from "./schemas";

const line = { productId: "58fa9160-e816-4e31-8956-87f3ab69bd5e", quantity: 1 };
const order = (extra: object = {}) => ({
  items: [line],
  shippingAddress: { name: "Rahim", phone: "01711111111", street: "House 1", city: "Dhaka" },
  ...extra,
});

describe("checkout body limits", () => {
  it("a normal order passes", () => {
    expect(createOrderSchema.safeParse(order()).success).toBe(true);
  });

  it("refuses a giant item list or quantity", () => {
    expect(createOrderSchema.safeParse(order({ items: Array.from({ length: 51 }, () => line) })).success).toBe(false);
    expect(createOrderSchema.safeParse(order({ items: [{ ...line, quantity: 1001 }] })).success).toBe(false);
  });

  it("refuses megabytes of text", () => {
    expect(createOrderSchema.safeParse(order({ notes: "x".repeat(1001) })).success).toBe(false);
    expect(
      createOrderSchema.safeParse(order({ shippingAddress: { ...order().shippingAddress, street: "x".repeat(501) } })).success,
    ).toBe(false);
  });

  it("refuses too many variant options", () => {
    const variantSelections = Object.fromEntries(Array.from({ length: 11 }, (_, i) => [`o${i}`, "v"]));
    expect(createOrderSchema.safeParse(order({ items: [{ ...line, variantSelections }] })).success).toBe(false);
  });
});
