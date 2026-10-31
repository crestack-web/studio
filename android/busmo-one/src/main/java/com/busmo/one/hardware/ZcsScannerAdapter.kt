package com.busmo.one.hardware

/**
 * ZCS HQ barcode scanner adapter (HQrsanner).
 * Official peripheral API via DriverManager.getHQrsannerDriver().
 *
 * Lifecycle (from SDK checklist):
 * power on → ctrl → QRstartDecdingAndReciveData(timeout, buffer)
 * teardown: QRstopDecoding → QRscanDisconect → QRScanerCtrl
 */
class ZcsScannerAdapter(
    private val onBarcode: (String) -> Unit
) {
    @Volatile private var running = false

    fun startContinuousScan() {
        running = true
        /**
         * Pseudocode:
         * val scanner = DriverManager.getInstance().getHQrsannerDriver()
         * scanner.QRScanerPowerCtrl(1)
         * scanner.QRScanerCtrl(0) // enter scan mode per device manual
         * while (running) {
         *   val data = ByteArray(256)
         *   val result = scanner.QRstartDecdingAndReciveData(60_000, data, …)
         *   if (result == SdkResult.SDK_OK) {
         *     val code = data.decodeToString().trim { it <= ' ' || it == '\u0000' }
         *     if (code.isNotEmpty()) onBarcode(code)
         *   }
         * }
         */
    }

    fun stop() {
        running = false
        // scanner.QRstopDecoding(); scanner.QRscanDisconect(); scanner.QRScanerCtrl(1)
    }
}
