import { describe, it, expect } from "vitest";
import { sugerirEmail } from "./email-typo";

describe("sugerirEmail", () => {
  it("corrige los casos reales de nov-2026", () => {
    expect(sugerirEmail("pau.bravo9@gmail.con")).toBe("pau.bravo9@gmail.com");
    expect(sugerirEmail("sus.guillermoidrovo@ocloud.com")).toBe("sus.guillermoidrovo@icloud.com");
  });
  it("corrige otros errores típicos", () => {
    expect(sugerirEmail("ana@hotmal.com")).toBe("ana@hotmail.com");
    expect(sugerirEmail("ana@gmial.com")).toBe("ana@gmail.com");
    expect(sugerirEmail("Ana@Gmail.Con ")).toBe("ana@gmail.com");
  });
  it("no toca emails buenos ni dominios propios", () => {
    expect(sugerirEmail("ana@gmail.com")).toBeNull();
    expect(sugerirEmail("ana@hotmail.es")).toBeNull();
    expect(sugerirEmail("info@verdemadrid.com")).toBeNull();
    expect(sugerirEmail("ana@empresa.es")).toBeNull();
    expect(sugerirEmail("ana@")).toBeNull();
    expect(sugerirEmail("ana@gmx.com")).toBeNull();
    expect(sugerirEmail("ana@mail.com")).toBeNull();
  });
});
