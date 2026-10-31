# Busmo One — Android container (ZCS / Z90 SDK)

Lightweight **WebView shell** around the existing Busmo staff Terminal Mode.
Native layer only exposes hardware: barcode scanner + thermal printer.

> Hardware integration is **specified from the official POS Android SDK docs** (`com.zcs.sdk`).
> It is **not** claimed tested on a physical Z90 until device + AAR are available.

## Architecture

```
Busmo One APK (Android)
  ├─ WebView → https://busmo.io/staff (Terminal Mode)
  ├─ BusmoOneBridge (JS interface)
  ├─ ZcsScannerAdapter  → DriverManager.getHQrsannerDriver()
  └─ ZcsPrinterAdapter  → DriverManager.getPrinter()
         │
         ▼
Busmo web APIs (auth, products, sales, inventory)
```

## SDK dependency (manufacturer)

Add the POS Android SDK AAR/JAR supplied with the Z90 (package root `com.zcs.sdk`):

```gradle
// app/build.gradle
dependencies {
  implementation files('libs/zcs-sdk.aar') // exact filename from manufacturer
}
```

Required packages used by Busmo One (from SDK docs):

| Area | Package / class |
|------|-----------------|
| Entry | `com.zcs.sdk.DriverManager` |
| Result codes | `com.zcs.sdk.SdkResult` |
| Printer | `com.zcs.sdk.Printer`, `com.zcs.sdk.print.PrnStrFormat`, `PrnTextStyle`, `PrnTextFont` |
| Scanner | `com.zcs.sdk.HQrsanner` (via `getHQrsannerDriver()`) |
| Init | SDK section **1.8 Initialization** — call before hardware |

**Not used in Busmo One phase 1:** EMV, pinpad, card reader, fingerprint, NFC payments.

## Web ↔ native protocol

Native → Web (JSON via `webView.evaluateJavascript` / `postMessage`):

```json
{ "type": "BARCODE_SCANNED", "barcode": "6151234567890" }
{ "type": "PRINTER_STATUS", "ready": true, "paperOk": true }
{ "type": "DEVICE_INFO", "deviceId": "…", "model": "Z90" }
```

Web → Native (`window.BusmoOneBridge.postMessage(json)`):

```json
{ "type": "START_SCANNER" }
{ "type": "STOP_SCANNER" }
{ "type": "PRINT_RECEIPT", "payload": { /* ReceiptData */ } }
{ "type": "REQUEST_DEVICE_INFO" }
```

## Testing without device

1. Staff portal → **Busmo One** Terminal Mode in Chrome.
2. Type barcodes + Enter (keyboard wedge path).
3. Complete sale → browser mock print dialog.
4. When Z90 + AAR arrive: build this module, point WebView at production URL, verify scan/print only.

## Security

- No Supabase service-role keys in the APK.
- Staff login remains Busmo web auth inside the WebView.
- Device registration (`terminal_devices`) is optional metadata; authorization is still server-side on `/api/sales/record`.
