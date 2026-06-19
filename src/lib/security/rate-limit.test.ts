import { describe, it, expect } from "vitest";
import { RATE_LIMIT, isRateLimited } from "@/lib/security/rate-limit";

describe("isRateLimited", () => {
  it("permite cuando no hay fallos", () => {
    expect(isRateLimited(0, 0)).toBe(false);
  });

  it("permite justo por debajo del umbral del guardia", () => {
    expect(isRateLimited(RATE_LIMIT.guardia.max - 1, 0)).toBe(false);
  });

  it("bloquea al alcanzar el umbral del guardia", () => {
    expect(isRateLimited(RATE_LIMIT.guardia.max, 0)).toBe(true);
  });

  it("bloquea al alcanzar el umbral del fraccionamiento", () => {
    expect(isRateLimited(0, RATE_LIMIT.fraccionamiento.max)).toBe(true);
  });

  it("permite por debajo de ambos umbrales", () => {
    expect(isRateLimited(RATE_LIMIT.guardia.max - 1, RATE_LIMIT.fraccionamiento.max - 1)).toBe(false);
  });
});
