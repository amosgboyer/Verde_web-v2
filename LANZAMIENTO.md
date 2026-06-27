# 🚀 Lanzamiento Verde — Guía para el domingo

Todo lo que necesitas para avisar a la lista de espera por **WhatsApp** y **email**.

---

## 📅 Fechas y fases (ya configuradas en la web, automáticas)

| Cuándo | Quién puede reservar | Cómo |
|--------|----------------------|------|
| **Domingo 28 + Lunes 29** | Solo lista de espera | Con el **código** |
| **Martes 30 (00:00) en adelante** | Todo el mundo | Sin código, reserva libre |

- **Entrega:** miércoles a domingo. Días abiertos ahora: **1–5 y 8–12 de julio**.
- **Horario:** 9–13 y 15–20. **1 cupo por hora.**
- La web cambia de "solo lista" a "público" **sola** el martes. No tienes que tocar nada.

---

## 🔑 EL CÓDIGO (esto es lo que mandas)

```
01110110 01100101 01110010 01100100 01100101
```

Es "verde" en binario. Al pegarlo en la web hace una **animación de descifrado** que revela **VERDE MADRID** y desbloquea la reserva. Vale pegado con o sin espacios.

---

## ✉️ EL MENSAJE (mismo texto para WhatsApp y email)

**Asunto (email):** `Tu acceso anticipado a Verde 🌱`

**Cuerpo:**

> ¡Hola! 🌱 Gracias por apuntarte a la lista de espera de **Verde**.
>
> Por ser de los primeros, tienes **acceso anticipado** antes que nadie:
> 🗓️ **Domingo y lunes** puedes reservar con tu código. El **martes** abrimos para todos.
>
> 🔓 Tu código de acceso (cópialo y pégalo en la web):
> **01110110 01100101 01110010 01100100 01100101**
>
> 👉 Entra en **https://www.verdemadrid.com**, baja a *"Haz tu pedido"*, pega el código y verás la magia ✨. Luego elige tu pack o plato y reserva tu día (entregamos miércoles a domingo).
>
> ⚡ Plazas limitadas — **1 cupo por hora**. ¡Corre que vuelan!
>
> — Verde Madrid

> Consejo: en WhatsApp puedes acortar el cuerpo si quieres, pero **deja siempre el código y el enlace**.

---

## 📲 WHATSAPP — Meta Cloud API (barato: ~8 € una vez, sin cuota)

> Sale **desde un número secundario** con el nombre **"Verde Madrid"**. No se toca
> el WhatsApp diario de Verde (un número no puede estar en la app y en la API a la vez).

**Lo que necesitas conseguir:**
- [ ] Un **número secundario** (SIM prepago o línea que NO uses en WhatsApp) que reciba SMS/llamada.
- [ ] Cuenta de **Meta Business** (la del Instagram/Facebook de Verde vale).
- [ ] Una **tarjeta** para añadir a Meta (cobran ~0,06 €/mensaje → ~8 € por 129).

**Setup en Meta (tú, ~1h):**
1. **developers.facebook.com** → Crear app → tipo **Empresa** → añadir producto **WhatsApp**.
2. *WhatsApp → Configuración de API* → **Añadir número** = tu número secundario → verifícalo por SMS → nombre que se mostrará: **Verde Madrid**.
3. Añade el **método de pago** (Meta Business Settings → Facturación de WhatsApp).
4. Crea la **plantilla**: *WhatsApp Manager → Plantillas → Crear* → categoría **Marketing**, idioma **Español** → pega el mensaje (con el código) → enviar a aprobar (minutos–horas).
5. Apunta el **Phone Number ID** (en la pantalla de API Setup).
6. Consigue un **token**:
   - **Fácil:** el token temporal (24h) que sale en *Configuración de API* → genéralo el **domingo** justo antes y enviamos dentro de 24h.
   - **Robusto:** token permanente (Business Settings → Usuarios del sistema → permiso `whatsapp_business_messaging`).

**Pasarme las credenciales (sin chat):**
7. En **Vercel → Settings → Environment Variables** añade:
   - `WHATSAPP_TOKEN` = tu token
   - `WHATSAPP_PHONE_ID` = el Phone Number ID
8. Dime el **nombre de la plantilla** aprobada.

**El envío (lo hago YO):**
9. Monto un endpoint temporal que lee tu lista (del Google Sheet) y **envía la plantilla a los 129** vía Cloud API → te devuelvo "enviados: N" → borro el endpoint. Coste: ~8 € a Meta.

> No hace falta el CSV para esta vía (leo la lista directa del Sheet). El CSV te lo dejé igual por si lo quieres.

---

## 📧 EMAIL (a quienes dejaron correo)

Dos opciones:
- **Opción fácil (recomendada):** dime "manda los emails" el domingo y **los envío yo** con Resend (ya está montado, gratis). Te confirmo "enviados: N".
- **Opción tú:** súbete la lista a **Brevo/Mailchimp** (free), pega el mismo texto y envía.

> Como el teléfono era obligatorio, **WhatsApp llega a todos**; el email es refuerzo para quienes lo dejaron.

---

## 📄 EL CSV PARA WHATSAPP

La forma más segura (es tu dato de clientes) es **exportarlo de tu propio Google Sheet**:

1. Abre tu Google Sheet → pestaña **`Waitlist`**.
2. **Archivo → Descargar → CSV** (.csv).
3. Ese archivo ya trae **Nombre / Email / Teléfono** → súbelo a DoubleTick y mapea la columna de teléfono.

> Si quieres, yo te genero una versión ya limpia (nombre + teléfono con +34), dímelo.

---

## ⏰ CUÁNDO ENVIARLO

- **Sábado tarde o domingo a primera hora.** Así les da tiempo a reservar en la ventana de lista (dom–lun) antes de que abra al público el martes.

---

## ✅ CHECKLIST DEL DOMINGO

- [ ] Número de WhatsApp conectado en DoubleTick + plantilla aprobada
- [ ] CSV de la lista descargado y subido
- [ ] WhatsApp Broadcasting enviado
- [ ] Emails enviados (yo, o tú por Brevo)
- [ ] Probar tú mismo: pegar el código en la web → ver la animación → reservar
- [ ] Vigilar **Unified Inbox** (WhatsApp) y tu Gmail (avisos de pedido)

---

## 🆘 SI ALGO FALLA

- **"No hay días disponibles":** pídeme abrir más días/cupos en la pestaña Availability.
- **El código no desbloquea:** revisa que sea el binario de arriba (con o sin espacios).
- **Quieres cambiar el código, fechas o cupos:** dímelo y lo hago en 1 minuto.
- **Marcha atrás:** rollback en segundos si hiciera falta.
