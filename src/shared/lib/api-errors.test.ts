import { describe, expect, it, vi } from "vitest";
import { DrizzleQueryError } from "drizzle-orm/errors";
import { publicErrorMessage, serviceErrorResponse } from "./api-response";

// #14: database errors (SQL + parameters) must never reach the browser.
describe("serviceErrorResponse", () => {
  it("shows a service's own message", async () => {
    const res = serviceErrorResponse(new Error("Coupon has expired"), 400);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Coupon has expired" });
  });

  it("hides a database error behind a generic 500", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const dbError = new DrizzleQueryError(
      'select "id" from "addresses" where "id" = $1',
      ["abc"],
      new Error('invalid input syntax for type uuid: "abc"'),
    );
    const res = serviceErrorResponse(dbError, 400);
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("select");
    expect(text).not.toContain("addresses");
  });

  it("hides TypeErrors and non-errors too", () => {
    expect(publicErrorMessage(new TypeError("x is undefined"))).toBeNull();
    expect(publicErrorMessage("boom")).toBeNull();
  });
});
