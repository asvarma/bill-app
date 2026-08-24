# BillApp

A lightweight GST invoicing app for small traders and shop owners, built with Expo and React Native. Set up your business once, then create, preview, and share GST-compliant invoices in a few taps — all stored locally on the device.

## Features

- **Business profile setup** — name, GSTIN, state, and logo, captured once during onboarding
- **Trade templates** — pick a trade (hardware, electrical, textiles, etc.) to pre-fill common line item presets, or manage your own presets
- **Invoice creation** — party details, line items, and automatic CGST/SGST/IGST split based on business and party state
- **Invoice preview & sharing** — generate a PDF invoice and share it directly from the preview screen
- **Payment tracking** — mark invoices paid or unpaid, with status visible from the home screen and invoice list
- **Custom invoice numbering** — configure your own numbering scheme per business
- **Local-first storage** — all data lives in an on-device SQLite database, no account or internet connection required

## Tech stack

- [Expo](https://expo.dev) / React Native
- TypeScript
- React Navigation (native stack + bottom tabs)
- expo-sqlite for local persistence
- expo-print / expo-sharing for PDF generation and sharing

## Getting started

```bash
npm install
npm start
```

This opens the Expo dev server. From there, run on Android (`npm run android`), iOS (`npm run ios`), or web (`npm run web`).

### Building for Android

Native Android sources are generated via Expo prebuild and are not checked into this repo. To produce a release build:

```bash
npx expo prebuild -p android
cd android
./gradlew bundleRelease   # .aab for Play Store
./gradlew assembleRelease # .apk for direct install
```

Release builds are signed using `android/keystore.properties`, which is not committed and must be provided locally.

## Project structure

```
Components/   Reusable UI building blocks (Button, Card, form fields, status badges)
Screens/      One file per app screen
Navigation/   Stack and tab navigator setup
Services/     Database access, GST calculation, PDF/share logic
Data/         Types and trade template presets
Theme/        Colors, spacing, typography tokens
```
