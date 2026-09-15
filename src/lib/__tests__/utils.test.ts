import { describe, test, expect } from "vitest";
import { cn } from "../utils";

describe("cn (className merge helper)", () => {
  test("concatenates truthy classes", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  test("skips falsy values", () => {
    expect(cn("a", false, null, undefined, "", "b")).toBe("a b");
  });

  test("later tailwind utilities override earlier ones", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  test("handles conditional object form", () => {
    expect(cn({ hidden: false, block: true })).toBe("block");
  });

  test("flattens arrays", () => {
    expect(cn(["a", ["b", "c"]])).toBe("a b c");
  });
});
