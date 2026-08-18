package vn.iflux.app.ui.components

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import vn.iflux.app.core.config.IfxAppConfig

@SuppressLint("SetJavaScriptEnabled")
@Composable
fun IfxWebView(path: String, modifier: Modifier = Modifier) {
    val url = IfxAppConfig.url(path)
    AndroidView(
        modifier = modifier.fillMaxSize(),
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                settings.loadsImagesAutomatically = true
                webViewClient = WebViewClient()
                webChromeClient = WebChromeClient()
                setBackgroundColor(0xFF101218.toInt())
                loadUrl(url)
            }
        },
        update = { webView ->
            if (webView.url != url) webView.loadUrl(url)
        }
    )
}
