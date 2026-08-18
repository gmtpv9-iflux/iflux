import Foundation

struct IfxMeta: Codable {
    var connection: String = "connected"
    var degraded: Bool = false
    var dataAsOf: String?

    enum CodingKeys: String, CodingKey {
        case connection, degraded
        case dataAsOf = "data_as_of"
    }
}

struct IfxSticker: Codable, Hashable {
    var sectorRank: Int?
    var sectorPg: Double?
    var trend: String?

    enum CodingKeys: String, CodingKey {
        case sectorRank = "sector_rank"
        case sectorPg = "sector_pg"
        case trend
    }
}

struct IfxStock: Codable, Identifiable, Hashable {
    var ticker: String
    var name: String?
    var price: Double?
    var changePct: Double?
    var volume: String?
    var ts: String?
    var sticker: IfxSticker?

    var id: String { ticker }

    enum CodingKeys: String, CodingKey {
        case ticker, name, price, volume, ts, sticker
        case changePct = "change_pct"
    }
}

struct IfxSector: Codable, Identifiable, Hashable {
    var id: Int
    var name: String?
    var ig: Double
    var pg: Double
    var breadthUp: Int
    var breadthDown: Int
    var ts: String?

    enum CodingKeys: String, CodingKey {
        case id, name, ig, pg, ts
        case breadthUp = "breadth_up"
        case breadthDown = "breadth_down"
    }
}

struct IfxMarketSnapshot: Codable {
    var ig: Double
    var pg: Double
    var breadthUp: Int
    var breadthDown: Int

    enum CodingKeys: String, CodingKey {
        case ig, pg
        case breadthUp = "breadth_up"
        case breadthDown = "breadth_down"
    }
}

struct IfxFlowSummary: Codable {
    var buyPct: Double
    var sellPct: Double
    var netLabel: String

    enum CodingKeys: String, CodingKey {
        case buyPct = "buy_pct"
        case sellPct = "sell_pct"
        case netLabel = "net_label"
    }
}

struct IfxUserPlan: Codable {
    var name: String
    var tier: String
    var cycle: String
    var price: Double
    var currency: String
    var period: String
}

struct IfxUser: Codable {
    var id: String
    var email: String?
    var phone: String?
    var displayName: String
    var tier: String
    var tierLabel: String?
    var subscriptionPhase: String?
    var plan: IfxUserPlan?

    enum CodingKeys: String, CodingKey {
        case id, email, phone, tier, plan
        case displayName = "display_name"
        case tierLabel = "tier_label"
        case subscriptionPhase = "subscription_phase"
    }
}

struct IfxSession: Codable {
    var user: IfxUser
    var token: String?
}

/// Global entity store — single SoT per 08 §2.1 (mirrors Web sandbox)
final class EntityStore: ObservableObject {
    @Published private(set) var meta = IfxMeta()
    @Published private(set) var stocks: [String: IfxStock] = [:]
    @Published private(set) var sectors: [Int: IfxSector] = [:]
    @Published private(set) var ecosystems: [Int: IfxSector] = [:]
    @Published private(set) var market = IfxMarketSnapshot(ig: 0, pg: 0, breadthUp: 0, breadthDown: 0)
    @Published private(set) var flow: [String: IfxFlowSummary] = [:]
    @Published var currentUser: IfxUser?

    func hydrate(from snapshot: MockMarketSnapshot) {
        stocks = snapshot.stocks
        sectors = snapshot.sectors
        ecosystems = snapshot.ecosystems
        market = snapshot.market
        flow = snapshot.flow
        meta.dataAsOf = ISO8601DateFormatter().string(from: Date())
    }

    func patchStock(_ stock: IfxStock) {
        stocks[stock.ticker] = stock
    }
}

struct MockMarketSnapshot {
    var stocks: [String: IfxStock]
    var sectors: [Int: IfxSector]
    var ecosystems: [Int: IfxSector]
    var market: IfxMarketSnapshot
    var flow: [String: IfxFlowSummary]
}
