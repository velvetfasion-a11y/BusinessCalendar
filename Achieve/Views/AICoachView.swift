import SwiftUI

/// Achieve AI Coach tab — same place in the app shell, now backed by the
/// in-app WebLLM + Kokoro engine (not a separate product).
struct AICoachView: View {
    var body: some View {
        CoachWebView()
            .padding(.bottom, 110)
            .ignoresSafeArea(edges: .top)
            .background(Color(hex: "#0D0D0D").ignoresSafeArea())
    }
}

#Preview {
    ZStack(alignment: .bottom) {
        Color(hex: "#0D0D0D").ignoresSafeArea()
        AICoachView()
    }
}
