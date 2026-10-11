# লেখনি কাহিনী — Expo Go Test App

Alada clean project: `/root/LekhoniKahiniApp`
Original workspace: `/root/Lekhnii-Kahiniv2` (untouched)

## Oproyojoni file ja bad deya hoyeche:
- `scripts/build.js` (Replit deploy helper)
- `server/serve.js` + templates (Replit web serve)
- `.expo/`, `.replit-artifact/`
- `lib/*`, `artifacts/api-server`, `artifacts/mockup-sandbox`
- `@workspace/api-client-react` dependency (app-e কোথাও import নেই — local `data/books.ts` + Context দিয়ে চলে)
- `create-launch`, `zod`, Replit-specific `dev` script
- `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `.replit`, `replit.md`

## Ja rakha hoyeche (Expo Go-র জন্য দরকারি):
- `app/` (expo-router pages)
- `assets/images/`
- `components/`, `constants/`, `context/`, `data/`, `hooks/`
- `app.json`, `metro.config.js`, `babel.config.js`, `tsconfig.json`, `package.json`

## Test (Expo Go):
```bash
cd /root/LekhoniKahiniApp
npm install   # অথবা: pnpm install
npx expo start --tunnel
# QR code scan korun Expo Go app diye (Android/iOS)
# Tunnel na cholle: npx expo start --lan
```

Note: first `install` slow network-e 10-20 min lagte pare (ECONNRESET retry hoy).
