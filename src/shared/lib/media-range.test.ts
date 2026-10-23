import { describe, expect, it } from "vitest";
import { parseRange } from "./media-range";

describe("parseRange", () => {
  it("reads a closed range", () => {
    expect(parseRange("bytes=0-1023", 5000)).toEqual({ start: 0, end: 1023 });
  });

  it("reads an open-ended range to the last byte", () => {
    expect(parseRange("bytes=4000-", 5000)).toEqual({ start: 4000, end: 4999 });
  });

  it("reads a suffix range as the last N bytes", () => {
    expect(parseRange("bytes=-500", 5000)).toEqual({ start: 4500, end: 4999 });
  });

  it("clamps an end past the object to the last byte", () => {
    expect(parseRange("bytes=0-99999", 5000)).toEqual({ start: 0, end: 4999 });
  });

  it("flags a start past the end as unsatisfiable", () => {
    expect(parseRange("bytes=6000-", 5000)).toBe("unsatisfiable");
  });

  it("serves the whole object for multi-range, other units, or no header", () => {
    expect(parseRange("bytes=0-1,5-9", 5000)).toBeNull();
    expect(parseRange("items=0-1", 5000)).toBeNull();
    expect(parseRange(null, 5000)).toBeNull();
  });
});
