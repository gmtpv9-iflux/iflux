import SwiftUI

/// Shell native — nội dung WebView = User_Web MVP (đồng bộ 100% với Web + Admin)
struct MainTabView: View {
    @State private var selectedTab: String = "home"
    @State private var overlayPath: String?
    @State private var showQuickMenu = false

    var body: some View {
        VStack(spacing: 0) {
            topBar
            tabWebContent
            bottomBar
        }
        .background(IfxTokens.surface.ignoresSafeArea())
        .sheet(isPresented: $showQuickMenu) {
            quickMenuSheet
        }
        .fullScreenCover(item: $overlayPath) { path in
            NavigationView {
                IfxWebScreen(path: path)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .navigationBarLeading) {
                            Button("Đóng") { overlayPath = nil }
                        }
                    }
            }
            .navigationViewStyle(.stack)
        }
    }

    private var topBar: some View {
        HStack(spacing: 12) {
            IfxBrandName()
            Spacer()
            Button { showQuickMenu = true } label: {
                Image(systemName: "ellipsis.circle")
                    .foregroundStyle(IfxTokens.textPrimary)
            }
        }
        .padding(.horizontal, IfxTokens.space4)
        .padding(.vertical, IfxTokens.space2)
        .background(IfxTokens.surfaceElevated)
    }

    @ViewBuilder
    private var tabWebContent: some View {
        if let tab = IfxAppConfig.mainTabs.first(where: { $0.id == selectedTab }) {
            IfxWebScreen(path: tab.path)
        }
    }

    private var bottomBar: some View {
        HStack {
            ForEach(IfxAppConfig.mainTabs) { tab in
                Button {
                    selectedTab = tab.id
                    overlayPath = nil
                } label: {
                    VStack(spacing: 4) {
                        Image(systemName: tab.systemImage)
                        Text(tab.label)
                            .font(.system(size: 9, weight: .medium))
                            .lineLimit(1)
                            .minimumScaleFactor(0.8)
                    }
                    .frame(maxWidth: .infinity)
                    .foregroundStyle(selectedTab == tab.id ? IfxTokens.brandPrimary : IfxTokens.textSecondary)
                }
            }
        }
        .padding(.vertical, 8)
        .background(IfxTokens.surfaceElevated)
    }

    private var quickMenuSheet: some View {
        NavigationView {
            List {
                Section("Truy cập nhanh") {
                    ForEach(IfxAppConfig.quickActions) { action in
                        Button {
                            showQuickMenu = false
                            overlayPath = action.path
                        } label: {
                            Label(action.label, systemImage: action.systemImage)
                        }
                    }
                }
                Section("Tài khoản") {
                    Button {
                        showQuickMenu = false
                        overlayPath = "/User_Web/home/index.html?tab=account"
                    } label: {
                        Label("Hồ sơ & cài đặt", systemImage: "person.crop.circle")
                    }
                    Button {
                        showQuickMenu = false
                        overlayPath = "/User_Web/account/checkout.html"
                    } label: {
                        Label("Thanh toán gói", systemImage: "creditcard")
                    }
                }
            }
            .navigationTitle("Menu")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Đóng") { showQuickMenu = false }
                }
            }
        }
        .navigationViewStyle(.stack)
    }
}

extension String: Identifiable {
    public var id: String { self }
}
