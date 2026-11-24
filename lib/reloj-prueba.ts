// SOLO RAMA DE PRUEBA (prueba/bf-reloj-miercoles) — NUNCA se publica.
// Adelanta el reloj de la web al miércoles 25 a las 12:00 (Madrid) para poder
// probar el Black Friday funcionando antes de que llegue la fecha.
export const RELOJ_PRUEBA = "2026-11-25T12:00:00+01:00";

export const SCRIPT_RELOJ = `(function(){var off=Date.parse("${RELOJ_PRUEBA}")-Date.now();var R=Date;
function F(){var a=[].slice.call(arguments);if(!a.length)return new R(R.now()+off);return new (Function.prototype.bind.apply(R,[null].concat(a)))();}
F.prototype=R.prototype;F.now=function(){return R.now()+off};F.parse=R.parse;F.UTC=R.UTC;window.Date=F;})();`;

export function instalarRelojServidor() {
  const g = globalThis as unknown as { __relojPrueba?: boolean; Date: DateConstructor };
  if (g.__relojPrueba) return;
  g.__relojPrueba = true;
  const R = Date;
  const off = Date.parse(RELOJ_PRUEBA) - R.now();
  class F extends R {
    constructor(...a: unknown[]) {
      if (!a.length) super(R.now() + off);
      // @ts-expect-error — reenvía los argumentos tal cual a Date
      else super(...a);
    }
    static now() {
      return R.now() + off;
    }
  }
  g.Date = F as unknown as DateConstructor;
}
