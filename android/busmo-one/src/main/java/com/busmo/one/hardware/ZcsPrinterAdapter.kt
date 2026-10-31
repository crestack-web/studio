package com.busmo.one.hardware

/**
 * ZCS thermal printer adapter for Busmo One.
 * Methods mirror official POS Android SDK guide §3 (com.zcs.sdk.Printer).
 *
 * Requires manufacturer AAR on the device classpath.
 * Do not call from the WebView thread — use DriverManager.getSingleThreadExecutor().
 */
class ZcsPrinterAdapter(
    private val driverManager: Any // com.zcs.sdk.DriverManager when SDK present
) {
    /**
     * Pseudocode against real SDK (compile when AAR is linked):
     *
     * val mPrinter = DriverManager.getInstance().getPrinter()
     * val status = mPrinter.getPrinterStatus()
     * if (status == SdkResult.SDK_PRN_STATUS_PAPEROUT) throw PaperOutException()
     * val format = PrnStrFormat().apply {
     *   setTextSize(24)
     *   setAli(Layout.Alignment.ALIGN_NORMAL)
     *   setStyle(PrnTextStyle.NORMAL)
     * }
     * lines.forEach { mPrinter.setPrintAppendString(it, format) }
     * mPrinter.setPrintStart()
     */
    fun printLines(lines: List<String>) {
        // Implementation lives in the APK once zcs-sdk.aar is available.
        throw UnsupportedOperationException(
            "Link com.zcs.sdk Printer AAR and implement setPrintAppendString + setPrintStart"
        )
    }

    fun status(): String {
        // mPrinter.getPrinterStatus() → map SdkResult constants
        return "NOT_LINKED"
    }
}
