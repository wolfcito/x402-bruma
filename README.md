# x402 Bruma — Simulador de Informe Crediticio

Demo de Next.js que muestra cómo proteger APIs con x402 en Avalanche/Avalanche Fuji usando el facilitador de Ultraviolet. La app expone un resumen crediticio gratuito y un informe completo simulado (JSON) que cuesta $0.01 en USDC. Incluye manejo explícito para rechazos de la wallet y un paywall basado únicamente en `/api/premium`.

## Requisitos

- Node.js 20+
- pnpm
- Wallet EVM inyectada en el navegador (MetaMask, Rabby, etc.) con USDC/USDC.e en la red elegida
- Variables de entorno en `.env.local`:
  ```bash
  NEXT_PUBLIC_EVM_RECEIVER_ADDRESS=0xYourReceiver
  NEXT_PUBLIC_FACILITATOR_URL=https://facilitator.yourdomain.xyz
  # Opcional: NEXT_PUBLIC_DEFAULT_NETWORK=avalanche-fuji
  ```

## Comandos

```bash
pnpm install      # instala dependencias
pnpm dev          # inicia el servidor en http://localhost:3000
pnpm build && pnpm start  # build + producción local
pnpm lint         # Biome
```

## Qué incluye

- `/api/free`: snapshot gratuito con banda de score estimada, porcentaje de utilización y notas.
- `/api/premium`: informe JSON completo (score, cuentas, alertas) servido tras cubrir la tarifa en la red seleccionada.
- `app/page.tsx`: selector de red, botones en negro aptos para dark/light theme y mensajes específicos si se cancela la firma (`Cancelaste la solicitud en la wallet. Nada fue cobrado.`).
- `proxy.ts`: middleware único que cachea las redes soportadas vía `/supported`, fija los contratos USDC (Fuji/Mainnet) y sólo intercepta `/api/premium`.

## Flujo de pago

1. La UI cliente utiliza `wrapFetchWithPayment` (paquete `x402-fetch`) para transformar el `fetch` de `/api/premium` en un flujo 402 → wallet → retry.
2. Cuando se consulta `/api/premium?network=avalanche-fuji` sin pagar:
   ```bash
   curl -i "http://localhost:3000/api/premium?network=avalanche-fuji"
   ```
   se recibe `HTTP/1.1 402 Payment Required` con cabeceras `x-402-*`.
3. Tras firmar/pagar en la wallet, el helper reintenta y obtiene `200 OK` con el JSON del informe.

## Personalizar / extender

- Agrega rutas premium nuevas creando `app/<ruta>/route.ts` y registrándolas en `routesFor` dentro de `proxy.ts`.
- Ajusta precios/activos en `ERC20_PRICE_ASSETS` si deseas usar otro contrato o monto.
- Para ocultar o mostrar mensajes adicionales en la UI, edita los handlers `handleFreePromptClick` / `handlePremiumPromptClick`.
