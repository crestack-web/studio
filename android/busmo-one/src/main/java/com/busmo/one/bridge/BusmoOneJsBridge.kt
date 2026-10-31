package com.busmo.one.bridge

import android.webkit.JavascriptInterface
import android.webkit.WebView
import org.json.JSONObject

/**
 * Injected as window.BusmoOneBridge for Terminal Mode.
 * Web posts JSON commands; native posts BARCODE_SCANNED / PRINTER_STATUS events.
 */
class BusmoOneJsBridge(
    private val webView: WebView,
    private val onStartScanner: () -> Unit,
    private val onStopScanner: () -> Unit,
    private val onPrintReceipt: (JSONObject) -> Unit,
) {
    @JavascriptInterface
    fun postMessage(raw: String) {
        try {
            val msg = JSONObject(raw)
            when (msg.optString("type")) {
                "START_SCANNER" -> onStartScanner()
                "STOP_SCANNER" -> onStopScanner()
                "PRINT_RECEIPT" -> onPrintReceipt(msg.optJSONObject("payload") ?: JSONObject())
                "REQUEST_DEVICE_INFO" -> {
                    // fill from Build / Sys when SDK linked
                }
            }
        } catch (_: Exception) {
        }
    }

    fun emitBarcode(barcode: String) {
        val json = JSONObject()
            .put("type", "BARCODE_SCANNED")
            .put("barcode", barcode)
            .toString()
        webView.post {
            webView.evaluateJavascript(
                "window.dispatchEvent(new MessageEvent('message',{data:$json}));",
                null
            )
        }
    }
}
