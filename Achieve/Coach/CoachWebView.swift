import SwiftUI
import WebKit

/// Hosts the Achieve AI Coach web engine (WebLLM + Kokoro) inside the app.
struct CoachWebView: UIViewRepresentable {
    func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.preferences.javaScriptCanOpenWindowsAutomatically = false
        config.defaultWebpagePreferences.allowsContentJavaScript = true
        config.websiteDataStore = .default()

        if #available(iOS 14.0, *) {
            config.preferences.setValue(true, forKey: "allowFileAccessFromFileURLs")
        }

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.isOpaque = false
        webView.backgroundColor = UIColor(red: 0.05, green: 0.05, blue: 0.05, alpha: 1)
        webView.scrollView.backgroundColor = webView.backgroundColor
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        context.coordinator.webView = webView
        context.coordinator.start()
        return webView
    }

    func updateUIView(_ uiView: WKWebView, context: Context) {}

    final class Coordinator {
        var webView: WKWebView?

        @MainActor
        func start() {
            do {
                try CoachStaticServer.shared.startIfNeeded()
                guard let url = CoachStaticServer.shared.baseURL else { return }
                webView?.load(URLRequest(url: url))
            } catch {
                let html = """
                <html><body style="background:#0D0D0D;color:#fff;font-family:-apple-system;padding:24px">
                <h2>AI Coach</h2>
                <p>Could not start the local coach engine.</p>
                <p style="opacity:0.7">\(error.localizedDescription)</p>
                </body></html>
                """
                webView?.loadHTMLString(html, baseURL: nil)
            }
        }
    }
}
