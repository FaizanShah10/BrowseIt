import { describe, expect, it } from "vitest";
import { normalizeAddress } from "../lib/normalizeAddress";

describe("normalizeAddress", () => {
  it("lowercases the address", () => {
    expect(normalizeAddress("TidePool.ZZ")).toBe("tidepool.zz");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizeAddress("  tidepool.zz  ")).toBe("tidepool.zz");
  });

  it("strips a leading http://", () => {
    expect(normalizeAddress("http://tidepool.zz")).toBe("tidepool.zz");
  });

  it("strips a leading https://", () => {
    expect(normalizeAddress("https://tidepool.zz")).toBe("tidepool.zz");
  });

  it("strips a trailing slash", () => {
    expect(normalizeAddress("tidepool.zz/")).toBe("tidepool.zz");
  });

  it("strips multiple trailing slashes", () => {
    expect(normalizeAddress("tidepool.zz///")).toBe("tidepool.zz");
  });

  it("applies all transforms together", () => {
    expect(normalizeAddress("  HTTPS://TidePool.ZZ/  ")).toBe("tidepool.zz");
  });

  it("preserves path segments after the host", () => {
    expect(normalizeAddress("https://garden.zz/plots/1/")).toBe(
      "garden.zz/plots/1",
    );
  });
});
