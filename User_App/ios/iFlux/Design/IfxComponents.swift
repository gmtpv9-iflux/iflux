import SwiftUI

struct IfxBrandName: View {
    var body: some View {
        Text("iFlux")
            .font(.system(size: 20, weight: .bold))
            .foregroundStyle(IfxTokens.brandOnPrimary)
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(IfxTokens.brandPrimary)
            .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusBrand, style: .continuous))
    }
}

struct IfxStockRow: View {
    let stock: IfxStock

    var body: some View {
        HStack(spacing: IfxTokens.space3) {
            VStack(alignment: .leading, spacing: 2) {
                Text(stock.ticker)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(IfxTokens.textPrimary)
                if let name = stock.name {
                    Text(name)
                        .font(.system(size: 12))
                        .foregroundStyle(IfxTokens.textSecondary)
                        .lineLimit(1)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(formatPrice(stock.price))
                    .font(.system(size: 15, weight: .bold, design: .monospaced))
                    .foregroundStyle(IfxTokens.textPrimary)
                Text(formatChange(stock.changePct))
                    .font(.system(size: 12, weight: .semibold, design: .monospaced))
                    .foregroundStyle(changeColor(stock.changePct))
            }
        }
        .padding(.vertical, IfxTokens.space2)
    }

    private func formatPrice(_ value: Double?) -> String {
        guard let value else { return "—" }
        return String(format: "%.2f", value)
    }

    private func formatChange(_ value: Double?) -> String {
        guard let value else { return "—" }
        return String(format: "%+.2f%%", value)
    }

    private func changeColor(_ value: Double?) -> Color {
        guard let value else { return IfxTokens.textSecondary }
        return value >= 0 ? IfxTokens.positive : IfxTokens.negative
    }
}

struct IfxSectorCard: View {
    let sector: IfxSector

    var body: some View {
        VStack(alignment: .leading, spacing: IfxTokens.space2) {
            Text(sector.name ?? "Ngành \(sector.id)")
                .font(.system(size: 14, weight: .semibold))
                .foregroundStyle(IfxTokens.textPrimary)
            HStack {
                Text(String(format: "Ig %.1f", sector.ig))
                    .font(.system(size: 13, design: .monospaced))
                Spacer()
                Text(String(format: "%+.2f%%", sector.pg))
                    .font(.system(size: 13, weight: .semibold, design: .monospaced))
                    .foregroundStyle(sector.pg >= 0 ? IfxTokens.positive : IfxTokens.negative)
            }
            .foregroundStyle(IfxTokens.textSecondary)
        }
        .padding(IfxTokens.space3)
        .background(IfxTokens.surfaceElevated)
        .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusMd))
        .overlay(RoundedRectangle(cornerRadius: IfxTokens.radiusMd).stroke(IfxTokens.border))
    }
}

struct IfxPrimaryButton: View {
    let title: String
    var action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 15, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, 12)
                .background(IfxTokens.brandPrimary)
                .foregroundStyle(IfxTokens.brandOnPrimary)
                .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusSm))
        }
    }
}

struct IfxScreenShell<Content: View>: View {
    let title: String
    @ViewBuilder var content: () -> Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: IfxTokens.space4) {
                Text(title)
                    .font(.system(size: 22, weight: .bold))
                    .foregroundStyle(IfxTokens.textPrimary)
                content()
            }
            .padding(IfxTokens.space4)
        }
        .background(IfxTokens.surface.ignoresSafeArea())
    }
}
