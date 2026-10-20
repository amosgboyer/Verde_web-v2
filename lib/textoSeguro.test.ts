import { describe, expect, it } from "vitest";
import { textoSeguro } from "./google-sheets";

describe("textoSeguro", () => {
  it("neutraliza lo que Sheets ejecutaría como fórmula", () => {
    expect(textoSeguro("=HYPERLINK(\"x\")")).toBe("'=HYPERLINK(\"x\")");
    expect(textoSeguro("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(textoSeguro("+cmd")).toBe("'+cmd");
    expect(textoSeguro("-(1+1)")).toBe("'-(1+1)");
  });
  it("deja intacto el texto normal", () => {
    expect(textoSeguro("Calle Mayor 3, 2ºB")).toBe("Calle Mayor 3, 2ºB");
    expect(textoSeguro("- sin cebolla")).toBe("- sin cebolla");
    expect(textoSeguro("+34 600 000 000")).toBe("+34 600 000 000");
    expect(textoSeguro("")).toBe("");
    expect(textoSeguro(undefined)).toBe("");
  });
});
