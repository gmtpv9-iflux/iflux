import SwiftUI
import WebKit

struct IfxWebView: UIViewRepresentable {
    let url: URL
    @Binding var isLoading: Bool
    var onNavigate: ((URL) -> Void)?

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.preferences.javaScriptCanOpenWindowsAutomatically = true
        let webView = WKWebView(frame: .zero, configuration: config)
        webView.navigationDelegate = context.coordinator
        webView.allowsBackForwardNavigationGestures = true
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.06, green: 0.07, blue: 0.10, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.lastLoaded != url else { return }
        context.coordinator.lastLoaded = url
        webView.load(URLRequest(url: url, cachePolicy: .useProtocolCachePolicy))
    }

    final class Coordinator: NSObject, WKNavigationDelegate {
        var parent: IfxWebView
        var lastLoaded: URL?

        init(_ parent: IfxWebView) {
            self.parent = parent
        }

        func webView(_ webView: WKWebView, didStartProvisionalNavigation navigation: WKNavigation!) {
            parent.isLoading = true
        }

        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            parent.isLoading = false
            if let url = webView.url {
                parent.onNavigate?(url)
            }
        }

        func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }

        func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
            parent.isLoading = false
        }
    }
}

struct IfxWebScreen: View {
    let path: String
    @State private var isLoading = false
    @State private var currentURL: URL?

    var body: some View {
        ZStack(alignment: .top) {
            IfxWebView(
                url: IfxAppConfig.url(for: path),
                isLoading: $isLoading,
                onNavigate: { currentURL = $0 }
            )
            if isLoading {
                ProgressView()
                    .tint(IfxTokens.brandPrimary)
                    .padding(.top, 8)
            }
        }
        .background(IfxTokens.surface)
    }
}
