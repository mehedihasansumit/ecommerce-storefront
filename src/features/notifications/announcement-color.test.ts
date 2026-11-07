import { describe, expect, it } from "vitest";
import { createAnnouncementSchema, updateAnnouncementSchema } from "./schemas";
import { isHexColor, safeHexColor } from "./color";

const base = { title: "Sale", message: "==50% off==", startDate: "2026-11-07" };
const ATTACK = `red" onmouseover="fetch('/api/admins')`;

describe("announcement colours", () => {
  it("the API refuses a colour that isn't a hex value", () => {
    expect(createAnnouncementSchema.safeParse({ ...base, backgroundColor: ATTACK }).success).toBe(false);
    expect(createAnnouncementSchema.safeParse({ ...base, textColor: "url(//x)" }).success).toBe(false);
    expect(updateAnnouncementSchema.safeParse({ backgroundColor: ATTACK }).success).toBe(false);
  });

  it("accepts what the colour picker sends, and defaults when omitted", () => {
    const parsed = createAnnouncementSchema.parse({ ...base, backgroundColor: "#E11D48" });
    expect(parsed.backgroundColor).toBe("#E11D48");
    expect(createAnnouncementSchema.parse(base).textColor).toBe("#ffffff");
  });

  it("an unsafe stored colour is replaced before it reaches the HTML", () => {
    expect(safeHexColor(ATTACK, "#1e40af")).toBe("#1e40af");
    expect(safeHexColor("#abc", "#1e40af")).toBe("#abc");
    expect(isHexColor("#12345")).toBe(false);
    expect(isHexColor("#11223344")).toBe(true);
  });
});
