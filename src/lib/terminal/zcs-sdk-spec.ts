/**
 * ZCS POS Android SDK — method map used by Busmo One (from official docs).
 * Source: POS Android SDK Developer Documentation (com.zcs.sdk).
 *
 * This file is documentation + TypeScript contracts only.
 * Real calls run inside the Android container, not in the browser.
 */

/** DriverManager.getInstance() — factory for all peripherals */
export const ZCS_PACKAGES = {
  root: 'com.zcs.sdk',
  print: 'com.zcs.sdk.print',
  driverManager: 'com.zcs.sdk.DriverManager',
  sdkResult: 'com.zcs.sdk.SdkResult',
  printer: 'com.zcs.sdk.Printer',
  prnStrFormat: 'com.zcs.sdk.print.PrnStrFormat',
  /** Typo preserved as in manufacturer SDK: HQrsanner */
  scanner: 'com.zcs.sdk.HQrsanner',
} as const;

/**
 * Printer (guide §3)
 * Buffered: append content, then setPrintStart() once.
 * All calls block — run on worker thread (DriverManager.getSingleThreadExecutor()).
 */
export const ZCS_PRINTER_API = {
  getPrinterStatus: 'Printer.getPrinterStatus(): int',
  setPrintAppendString: 'Printer.setPrintAppendString(String text, PrnStrFormat format)',
  setPrintStart: 'Printer.setPrintStart()',
  // Status constants
  SDK_OK: 'SdkResult.SDK_OK',
  SDK_PRN_STATUS_PAPEROUT: 'SdkResult.SDK_PRN_STATUS_PAPEROUT',
  SDK_PRN_STATUS_TOOHEAT: 'SdkResult.SDK_PRN_STATUS_TOOHEAT',
  SDK_PRN_STATUS_FAULT: 'SdkResult.SDK_PRN_STATUS_FAULT',
} as const;

/**
 * Scanner / HQ barcode (guide §7 peripherals)
 * DriverManager.getHQrsannerDriver()
 */
export const ZCS_SCANNER_API = {
  getDriver: 'DriverManager.getHQrsannerDriver()',
  powerCtrl: 'HQrsanner.QRScanerPowerCtrl(byte)',
  scanCtrl: 'HQrsanner.QRScanerCtrl(byte)',
  startDecode: 'HQrsanner.QRstartDecdingAndReciveData(timeoutMs, dataBuffer, …)',
  stopDecode: 'HQrsanner.QRstopDecoding()',
  disconnect: 'HQrsanner.QRscanDisconect()',
} as const;

export type ZcsPrinterStatusCode =
  | 'SDK_OK'
  | 'SDK_PRN_STATUS_PAPEROUT'
  | 'SDK_PRN_STATUS_TOOHEAT'
  | 'SDK_PRN_STATUS_FAULT'
  | 'UNKNOWN';
