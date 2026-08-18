import SwiftUI

struct DashboardView: View {
    @EnvironmentObject private var store: EntityStore
    @EnvironmentObject private var auth: AuthService
    var onSelectStock: (IfxStock) -> Void

    var body: some View {
        IfxScreenShell(title: "Xin chào, \(auth.session?.user.displayName ?? "bạn") 👋") {
            marketHeader
            section("Top biến động") {
                ForEach(MockMarketService.topMovers(from: store.stocks)) { stock in
                    Button { onSelectStock(stock) } label: {
                        IfxStockRow(stock: stock)
                    }
                }
            }
            section("Ngành nổi bật") {
                ForEach(Array(store.sectors.values.sorted { $0.pg > $1.pg }.prefix(3))) { sector in
                    IfxSectorCard(sector: sector)
                }
            }
        }
    }

    private var marketHeader: some View {
        VStack(alignment: .leading, spacing: IfxTokens.space2) {
            Text("VN-Index")
                .font(.system(size: 13))
                .foregroundStyle(IfxTokens.textSecondary)
            HStack(alignment: .firstTextBaseline) {
                Text(String(format: "%.1f", store.market.ig))
                    .font(.system(size: 28, weight: .bold, design: .monospaced))
                Text(String(format: "%+.2f%%", store.market.pg))
                    .font(.system(size: 14, weight: .semibold, design: .monospaced))
                    .foregroundStyle(store.market.pg >= 0 ? IfxTokens.positive : IfxTokens.negative)
            }
            .foregroundStyle(IfxTokens.textPrimary)
            Text("Tăng \(store.market.breadthUp) · Giảm \(store.market.breadthDown)")
                .font(.system(size: 12))
                .foregroundStyle(IfxTokens.textSecondary)
        }
        .padding(IfxTokens.space3)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(IfxTokens.surfaceElevated)
        .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusMd))
    }

    @ViewBuilder
    private func section(_ title: String, @ViewBuilder content: () -> some View) -> some View {
        VStack(alignment: .leading, spacing: IfxTokens.space2) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(IfxTokens.textPrimary)
            content()
        }
    }
}

struct MarketView: View {
    @EnvironmentObject private var store: EntityStore
    var onSelectStock: (IfxStock) -> Void

    var body: some View {
        IfxScreenShell(title: "Thị trường") {
            ForEach(Array(store.stocks.values.sorted { $0.ticker < $1.ticker })) { stock in
                Button { onSelectStock(stock) } label: {
                    IfxStockRow(stock: stock)
                }
            }
        }
    }
}

struct SectorsView: View {
    @EnvironmentObject private var store: EntityStore
    var onSelectStock: (IfxStock) -> Void

    var body: some View {
        IfxScreenShell(title: "Danh sách Ngành") {
            ForEach(Array(store.sectors.values.sorted { $0.id < $1.id })) { sector in
                IfxSectorCard(sector: sector)
            }
        }
    }
}

struct EcosystemsView: View {
    @EnvironmentObject private var store: EntityStore
    var onSelectStock: (IfxStock) -> Void

    var body: some View {
        IfxScreenShell(title: "Hệ sinh thái") {
            ForEach(Array(store.ecosystems.values.sorted { $0.id < $1.id })) { eco in
                IfxSectorCard(sector: eco)
            }
        }
    }
}

struct FlowView: View {
    @EnvironmentObject private var store: EntityStore
    var onSelectStock: (IfxStock) -> Void

    private let subjectLabels: [String: String] = [
        "foreign": "NĐT nước ngoài",
        "proprietary": "Tự doanh",
        "institutional": "Tổ chức",
        "retail": "Cá nhân"
    ]

    var body: some View {
        IfxScreenShell(title: "Dòng tiền") {
            ForEach(Array(store.flow.keys.sorted()), id: \.self) { key in
                if let item = store.flow[key] {
                    VStack(alignment: .leading, spacing: 6) {
                        Text(subjectLabels[key] ?? key)
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundStyle(IfxTokens.textPrimary)
                        HStack {
                            Text("Mua \(Int(item.buyPct))%")
                            Spacer()
                            Text("Bán \(Int(item.sellPct))%")
                        }
                        .font(.system(size: 12))
                        .foregroundStyle(IfxTokens.textSecondary)
                        Text(item.netLabel)
                            .font(.system(size: 12, weight: .medium))
                            .foregroundStyle(IfxTokens.positive)
                    }
                    .padding(IfxTokens.space3)
                    .background(IfxTokens.surfaceElevated)
                    .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusMd))
                }
            }
            sectionStocks
        }
    }

    private var sectionStocks: some View {
        VStack(alignment: .leading, spacing: IfxTokens.space2) {
            Text("Theo cổ phiếu")
                .font(.system(size: 16, weight: .semibold))
                .foregroundStyle(IfxTokens.textPrimary)
            ForEach(MockMarketService.topMovers(from: store.stocks, limit: 8)) { stock in
                Button { onSelectStock(stock) } label: {
                    IfxStockRow(stock: stock)
                }
            }
        }
    }
}

struct StockDetailView: View {
    let stock: IfxStock

    var body: some View {
        IfxScreenShell(title: stock.ticker) {
            Text(stock.name ?? stock.ticker)
                .foregroundStyle(IfxTokens.textSecondary)
            IfxStockRow(stock: stock)
            if let sticker = stock.sticker, let rank = sticker.sectorRank {
                Text("Sticker ngành: #\(rank)")
                    .font(.system(size: 13))
                    .foregroundStyle(IfxTokens.textSecondary)
            }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AlertsView: View {
    var body: some View {
        NavigationView {
            IfxScreenShell(title: "Alert Center") {
                Text("Danh sách cảnh báo đồng bộ với Web + Admin (sandbox).")
                    .foregroundStyle(IfxTokens.textSecondary)
                Text("Tính năng push FCM/APNs sẽ nối backend Epic 01.")
                    .font(.system(size: 12))
                    .foregroundStyle(IfxTokens.textSecondary)
            }
        }
        .navigationViewStyle(.stack)
    }
}

struct AccountView: View {
    @EnvironmentObject private var auth: AuthService
    @Environment(\.presentationMode) private var presentationMode

    var body: some View {
        NavigationView {
            IfxScreenShell(title: "Tài khoản") {
                if let user = auth.session?.user {
                    row("Họ tên", user.displayName)
                    row("Email", user.email ?? "—")
                    row("Gói", user.tierLabel ?? user.tier)
                }
                IfxPrimaryButton(title: "Đăng xuất") {
                    auth.logout()
                    presentationMode.wrappedValue.dismiss()
                }
            }
            .navigationBarItems(trailing: Button("Đóng") {
                presentationMode.wrappedValue.dismiss()
            })
        }
        .navigationViewStyle(.stack)
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).foregroundStyle(IfxTokens.textSecondary)
            Spacer()
            Text(value).foregroundStyle(IfxTokens.textPrimary)
        }
        .font(.system(size: 14))
    }
}
