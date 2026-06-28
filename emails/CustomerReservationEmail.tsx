import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Hr,
} from "@react-email/components";
import React from "react";
import { PICKUP_ADDRESS } from "../lib/store-config";

// ─── Shared types (mirror of lib/email OrderItem, no circular import) ───────
interface OrderItem {
  productName: string;
  quantity: number;
  finalPrice: number;
}

export interface CustomerReservationEmailProps {
  customerName: string;
  items: OrderItem[];
  reservationDate: string;
  reservationTime: string;
  deliveryMethod?: string;
  deliveryAddress?: string;
  deliveryDetails?: string;
  postalCode?: string;
  deliveryZone?: string;
  depositPaid: number;
  pendingAmount: number;
  subtotalBeforeDiscount?: number;
  discountAmount?: number;
  promoName?: string;
}

// ─── Brand palette ───────────────────────────────────────────────────────────
const V = {
  verde:   "#2E4F20",
  platano: "#509234",
  crema:   "#F5EDD8",
  cremaDark: "#EDE3C6",
  oro:     "#FFBC23",
  tierra:  "#9A4F0D",
  negro:   "#1A1A1A",
  gris:    "#7A7A6E",
  white:   "#FFFFFF",
};

// ─── Helper: info row ────────────────────────────────────────────────────────
function Row({
  label,
  value,
  accent = false,
  strong = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  strong?: boolean;
}) {
  return (
    <tr>
      <td
        style={{
          padding: "5px 0",
          fontSize: "13px",
          color: V.gris,
          width: "48%",
          verticalAlign: "top",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "5px 0",
          fontSize: "13px",
          color: accent ? V.tierra : V.negro,
          fontWeight: strong ? "700" : "400",
          textAlign: "right",
          verticalAlign: "top",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

// ─── Label above a section ───────────────────────────────────────────────────
function SectionLabel({ children }: { children: string }) {
  return (
    <p
      style={{
        margin: "0 0 8px 0",
        fontSize: "9px",
        fontWeight: "700",
        letterSpacing: "0.25em",
        textTransform: "uppercase",
        color: V.gris,
      }}
    >
      {children}
    </p>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function CustomerReservationEmail({
  customerName,
  items,
  reservationDate,
  reservationTime,
  deliveryMethod,
  deliveryAddress,
  deliveryDetails,
  postalCode,
  depositPaid,
  pendingAmount,
  subtotalBeforeDiscount,
  discountAmount,
  promoName,
}: CustomerReservationEmailProps) {
  const isDelivery = !deliveryMethod || deliveryMethod === "delivery";
  const hasDiscount = !!discountAmount && discountAmount > 0;

  return (
    <Html lang="es">
      <Head />
      <Preview>
        Pedido confirmado en Verde — {reservationDate} · {reservationTime}
      </Preview>
      <Body
        style={{
          backgroundColor: V.crema,
          fontFamily: "Arial, Helvetica, sans-serif",
          margin: 0,
          padding: "32px 16px",
        }}
      >
        <Container style={{ maxWidth: "520px", margin: "0 auto" }}>

          {/* ── Header ─────────────────────────────────── */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: V.verde }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "28px 32px" }}>
                  {/* Future: replace text logo with final brand logo image */}
                  <p
                    style={{
                      margin: "0 0 3px 0",
                      fontSize: "20px",
                      fontWeight: "700",
                      letterSpacing: "0.2em",
                      color: V.crema,
                      textTransform: "uppercase",
                    }}
                  >
                    VERDE
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "9px",
                      letterSpacing: "0.3em",
                      color: "rgba(245,237,216,0.45)",
                      textTransform: "uppercase",
                    }}
                  >
                    Madrid · Dark Kitchen
                  </p>
                </td>
                <td style={{ padding: "28px 32px", textAlign: "right", verticalAlign: "middle" }}>
                  <span
                    style={{
                      display: "inline-block",
                      backgroundColor: V.platano,
                      color: V.crema,
                      fontSize: "9px",
                      fontWeight: "700",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      padding: "5px 10px",
                    }}
                  >
                    Confirmado
                  </span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Card ────────────────────────────────────── */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: V.white }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "32px 32px 0 32px" }}>

                  {/* Greeting */}
                  <p
                    style={{
                      margin: "0 0 6px 0",
                      fontSize: "22px",
                      fontWeight: "700",
                      color: V.verde,
                      lineHeight: "1.2",
                    }}
                  >
                    Hola, {customerName}.
                  </p>
                  <p
                    style={{
                      margin: "0 0 24px 0",
                      fontSize: "14px",
                      color: "#555",
                      lineHeight: "1.6",
                    }}
                  >
                    Gracias por pedir en Verde. Tu pedido ya quedó confirmado y pagado.
                  </p>

                  {/* ── Products ── */}
                  <SectionLabel>Tu pedido</SectionLabel>
                  <table
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    style={{ marginBottom: "4px" }}
                  >
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              padding: "5px 0",
                              fontSize: "14px",
                              color: V.negro,
                            }}
                          >
                            {item.productName}{" "}
                            <span style={{ color: V.gris }}>×{item.quantity}</span>
                          </td>
                          <td
                            style={{
                              padding: "5px 0",
                              fontSize: "14px",
                              color: V.negro,
                              textAlign: "right",
                            }}
                          >
                            {item.finalPrice * item.quantity} €
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                </td>
              </tr>

              {/* Divider */}
              <tr>
                <td style={{ padding: "12px 32px" }}>
                  <Hr style={{ borderColor: V.cremaDark, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "0 32px" }}>

                  {/* ── Details ── */}
                  <SectionLabel>Detalles</SectionLabel>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <Row label="Fecha" value={reservationDate} />
                      <Row label="Hora" value={reservationTime} />
                      {isDelivery ? (
                        <>
                          <Row label="Dirección de entrega" value={deliveryAddress || "—"} />
                          {postalCode && <Row label="Código postal" value={postalCode} />}
                          {deliveryDetails && (
                            <Row label="Indicaciones" value={deliveryDetails} />
                          )}
                        </>
                      ) : (
                        <>
                          <Row label="Entrega" value="Recogida en local" />
                          <Row label="Recoges en" value={PICKUP_ADDRESS} />
                        </>
                      )}
                    </tbody>
                  </table>

                </td>
              </tr>

              {/* Divider */}
              <tr>
                <td style={{ padding: "12px 32px" }}>
                  <Hr style={{ borderColor: V.cremaDark, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "0 32px" }}>

                  {/* ── Payment ── */}
                  <SectionLabel>Pago</SectionLabel>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      {hasDiscount && subtotalBeforeDiscount !== undefined && (
                        <>
                          <Row label="Subtotal" value={`${subtotalBeforeDiscount} €`} />
                          <Row
                            label={promoName ?? "Descuento"}
                            value={`−${discountAmount} €`}
                            accent
                          />
                        </>
                      )}
                      <Row label="Total pagado" value={`${depositPaid} €`} strong />
                      {pendingAmount > 0 && (
                        <Row label="Pendiente" value={`${pendingAmount} €`} />
                      )}
                    </tbody>
                  </table>

                </td>
              </tr>

              {/* Divider */}
              <tr>
                <td style={{ padding: "20px 32px 0 32px" }}>
                  <Hr style={{ borderColor: V.cremaDark, margin: 0 }} />
                </td>
              </tr>

              {/* ── Note ── */}
              <tr>
                <td style={{ padding: "20px 32px 32px 32px" }}>
                  <p
                    style={{
                      margin: "0 0 8px 0",
                      fontSize: "13px",
                      color: "#555",
                      lineHeight: "1.6",
                    }}
                  >
                    Te escribiremos por WhatsApp si necesitamos coordinar algún
                    detalle de la entrega.
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "12px",
                      color: V.gris,
                      lineHeight: "1.5",
                    }}
                  >
                    Si tienes alguna duda, responde este correo o escríbenos por
                    WhatsApp:
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: "14px" }}>
                    <a
                      href="https://wa.me/34605442809"
                      style={{
                        color: V.platano,
                        fontWeight: "bold",
                        textDecoration: "none",
                      }}
                    >
                      📲 WhatsApp · +34 605 442 809
                    </a>
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Gold accent strip ── */}
          <table width="100%" cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td style={{ height: "4px", backgroundColor: V.oro }} />
              </tr>
            </tbody>
          </table>

          {/* ── Footer ── */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: V.negro }}
          >
            <tbody>
              <tr>
                <td
                  style={{
                    padding: "18px 32px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "9px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(245,237,216,0.35)",
                    }}
                  >
                    VERDE · Comida hecha bajo pedido · Madrid
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

        </Container>
      </Body>
    </Html>
  );
}
