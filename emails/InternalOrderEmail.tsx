import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Hr,
} from "@react-email/components";
import React from "react";

interface OrderItem {
  productName: string;
  quantity: number;
  finalPrice: number;
}

export interface InternalOrderEmailProps {
  customerName: string;
  email: string;
  phone: string;
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
  notes?: string;
  stripeSessionId?: string;
  privacyAccepted?: boolean;
  termsAccepted?: boolean;
  acceptedAt?: string;
  marketingOptIn?: boolean;
  subtotalBeforeDiscount?: number;
  discountAmount?: number;
  promoName?: string;
}

const V = {
  verde:   "#2E4F20",
  crema:   "#F5EDD8",
  oro:     "#FFBC23",
  tierra:  "#9A4F0D",
  negro:   "#1A1A1A",
  gris:    "#7A7A6E",
  white:   "#FFFFFF",
  bgLight: "#F9F6EF",
  border:  "#E0D9CC",
  urgent:  "#CC0000",
};

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <td
        style={{
          padding: "5px 12px 5px 0",
          fontSize: "12px",
          color: V.gris,
          width: "40%",
          verticalAlign: "top",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </td>
      <td
        style={{
          padding: "5px 0",
          fontSize: "12px",
          color: V.negro,
          verticalAlign: "top",
        }}
      >
        {value || "—"}
      </td>
    </tr>
  );
}

function BlockTitle({ children }: { children: string }) {
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

export function InternalOrderEmail({
  customerName,
  email,
  phone,
  items,
  reservationDate,
  reservationTime,
  deliveryMethod,
  deliveryAddress,
  deliveryDetails,
  postalCode,
  deliveryZone,
  depositPaid,
  pendingAmount,
  notes,
  stripeSessionId,
  privacyAccepted,
  termsAccepted,
  acceptedAt,
  marketingOptIn,
  subtotalBeforeDiscount,
  discountAmount,
  promoName,
}: InternalOrderEmailProps) {
  const isDelivery = !deliveryMethod || deliveryMethod === "delivery";
  const hasDiscount = !!discountAmount && discountAmount > 0;

  return (
    <Html lang="es">
      <Head />
      <Preview>
        Nuevo pedido pagado — {customerName} · {reservationDate} {reservationTime}
      </Preview>
      <Body
        style={{
          backgroundColor: V.bgLight,
          fontFamily: "Arial, Helvetica, sans-serif",
          margin: 0,
          padding: "24px 16px",
        }}
      >
        <Container style={{ maxWidth: "560px", margin: "0 auto" }}>

          {/* ── Header ── */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: V.verde }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "20px 28px" }}>
                  <p
                    style={{
                      margin: "0 0 2px 0",
                      fontSize: "11px",
                      letterSpacing: "0.25em",
                      color: "rgba(245,237,216,0.45)",
                      textTransform: "uppercase",
                    }}
                  >
                    Verde · Uso interno
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "18px",
                      fontWeight: "700",
                      color: V.crema,
                    }}
                  >
                    Nuevo pedido pagado
                  </p>
                </td>
                <td
                  style={{
                    padding: "20px 28px",
                    textAlign: "right",
                    verticalAlign: "middle",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "22px",
                      fontWeight: "700",
                      color: V.oro,
                    }}
                  >
                    {depositPaid} €
                  </p>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "9px",
                      color: "rgba(245,237,216,0.45)",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    Total pagado
                  </p>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── Oro strip ── */}
          <table width="100%" cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td style={{ height: "3px", backgroundColor: V.oro }} />
              </tr>
            </tbody>
          </table>

          {/* ── Body card ── */}
          <table
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ backgroundColor: V.white }}
          >
            <tbody>
              <tr>
                <td style={{ padding: "28px 28px 0 28px" }}>

                  {/* ── Cliente ── */}
                  <BlockTitle>Cliente</BlockTitle>
                  <table width="100%" cellPadding={0} cellSpacing={0} style={{ marginBottom: "4px" }}>
                    <tbody>
                      <DataRow label="Nombre" value={customerName} />
                      <DataRow label="Email" value={email} />
                      <DataRow label="WhatsApp" value={phone} />
                    </tbody>
                  </table>

                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>
                  <Hr style={{ borderColor: V.border, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>

                  {/* ── Pedido ── */}
                  <BlockTitle>Pedido</BlockTitle>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      {items.map((item, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              padding: "4px 12px 4px 0",
                              fontSize: "13px",
                              color: V.negro,
                            }}
                          >
                            {item.productName}
                          </td>
                          <td
                            style={{
                              padding: "4px 0",
                              fontSize: "13px",
                              color: V.gris,
                              textAlign: "center",
                            }}
                          >
                            ×{item.quantity}
                          </td>
                          <td
                            style={{
                              padding: "4px 0",
                              fontSize: "13px",
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

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>
                  <Hr style={{ borderColor: V.border, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>

                  {/* ── Fecha y hora ── */}
                  <BlockTitle>Reserva</BlockTitle>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <DataRow label="Fecha" value={reservationDate} />
                      <DataRow label="Hora" value={reservationTime} />
                    </tbody>
                  </table>

                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>
                  <Hr style={{ borderColor: V.border, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>

                  {/* ── Entrega ── */}
                  <BlockTitle>Entrega</BlockTitle>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <DataRow
                        label="Método"
                        value={isDelivery ? "Entrega a domicilio" : "Recogida"}
                      />
                      {isDelivery && (
                        <>
                          <DataRow label="Dirección" value={deliveryAddress || "—"} />
                          <DataRow label="Detalles" value={deliveryDetails || "—"} />
                          <DataRow label="Código postal" value={postalCode || "—"} />
                          <DataRow label="Zona" value={deliveryZone || "—"} />
                        </>
                      )}
                    </tbody>
                  </table>

                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>
                  <Hr style={{ borderColor: V.border, margin: 0 }} />
                </td>
              </tr>

              <tr>
                <td style={{ padding: "16px 28px 0 28px" }}>

                  {/* ── Pago ── */}
                  <BlockTitle>Pago</BlockTitle>
                  <table width="100%" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      {hasDiscount && subtotalBeforeDiscount !== undefined && (
                        <>
                          <DataRow label="Subtotal" value={`${subtotalBeforeDiscount} €`} />
                          <DataRow
                            label={`Descuento (${promoName ?? "promo"})`}
                            value={`−${discountAmount} €`}
                          />
                        </>
                      )}
                      <DataRow label="Total pagado" value={`${depositPaid} €`} />
                      <DataRow label="Pendiente" value={`${pendingAmount} €`} />
                    </tbody>
                  </table>

                </td>
              </tr>

              {notes && (
                <>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <Hr style={{ borderColor: V.border, margin: 0 }} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <BlockTitle>Notas del cliente</BlockTitle>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: V.negro,
                          lineHeight: "1.5",
                          backgroundColor: "#FDF8EE",
                          padding: "10px 12px",
                          borderLeft: `3px solid ${V.oro}`,
                        }}
                      >
                        {notes}
                      </p>
                    </td>
                  </tr>
                </>
              )}

              {(privacyAccepted !== undefined || termsAccepted !== undefined || acceptedAt) && (
                <>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <Hr style={{ borderColor: V.border, margin: 0 }} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <BlockTitle>Aceptaciones legales</BlockTitle>
                      <table width="100%" cellPadding={0} cellSpacing={0}>
                        <tbody>
                          <DataRow label="Política privacidad" value={privacyAccepted ? "Sí" : "No"} />
                          <DataRow label="Condiciones compra" value={termsAccepted ? "Sí" : "No"} />
                          <DataRow label="Ofertas por email" value={marketingOptIn ? "Sí" : "No"} />
                          {acceptedAt && <DataRow label="Fecha aceptación" value={acceptedAt} />}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </>
              )}

              {stripeSessionId && (
                <>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <Hr style={{ borderColor: V.border, margin: 0 }} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "16px 28px 0 28px" }}>
                      <BlockTitle>Referencia Stripe</BlockTitle>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          color: V.gris,
                          fontFamily: "monospace",
                          wordBreak: "break-all",
                        }}
                      >
                        {stripeSessionId}
                      </p>
                    </td>
                  </tr>
                </>
              )}

              <tr>
                <td style={{ padding: "24px 28px" }} />
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
                <td style={{ padding: "14px 28px", textAlign: "center" }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "9px",
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color: "rgba(245,237,216,0.3)",
                    }}
                  >
                    VERDE · Uso interno · No reenviar
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
