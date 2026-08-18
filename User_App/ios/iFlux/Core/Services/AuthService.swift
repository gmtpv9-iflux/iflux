import Foundation

enum StorageKeys {
    static let session = "iflux_user_session"
    static let profiles = "iflux_user_profiles_v1"
    static let mockOtp = "123456"
    static let demoPassword = "Demo@1234"
}

/// Auth — parity with User_Web/iflux-web-ui/auth.js (sandbox)
final class AuthService: ObservableObject {
    @Published private(set) var session: IfxSession?

    private let defaults = UserDefaults.standard

    init() {
        session = loadSession()
    }

    var isLoggedIn: Bool { session != nil }

    func login(email: String, password: String) throws {
        let normalized = email.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        guard !normalized.isEmpty, !password.isEmpty else {
            throw AuthError.invalidInput
        }
        if let user = findDemoUser(email: normalized, password: password) {
            persist(user: user)
            return
        }
        throw AuthError.invalidCredentials
    }

    func login(phone: String, password: String) throws {
        let digits = phone.filter(\.isNumber)
        guard digits.count >= 9, !password.isEmpty else {
            throw AuthError.invalidInput
        }
        if password == StorageKeys.demoPassword,
           digits.hasSuffix("912345678") || digits == "84912345678" {
            let user = IfxUser(
                id: "user-demo-phone",
                email: "minh@iflux.vn",
                phone: "0912345678",
                displayName: "Minh Demo",
                tier: "premium",
                tierLabel: "Premium",
                subscriptionPhase: "paid",
                plan: IfxUserPlan(name: "Premium", tier: "premium", cycle: "monthly", price: 299000, currency: "₫", period: "/tháng")
            )
            persist(user: user)
            return
        }
        throw AuthError.invalidCredentials
    }

    func register(email: String, password: String, displayName: String) -> String {
        // Returns pending OTP token — verify in verifyOtp()
        let pending = PendingRegistration(email: email, password: password, displayName: displayName)
        defaults.set(try? JSONEncoder().encode(pending), forKey: "iflux_pending_register")
        return StorageKeys.mockOtp
    }

    func verifyOtp(_ code: String) throws {
        guard code == StorageKeys.mockOtp else { throw AuthError.invalidOtp }
        guard let data = defaults.data(forKey: "iflux_pending_register"),
              let pending = try? JSONDecoder().decode(PendingRegistration.self, from: data) else {
            throw AuthError.noPendingRegistration
        }
        let user = IfxUser(
            id: "user-" + UUID().uuidString.prefix(8).lowercased(),
            email: pending.email,
            phone: nil,
            displayName: pending.displayName,
            tier: "free",
            tierLabel: "Miễn phí",
            subscriptionPhase: "freemium",
            plan: IfxUserPlan(name: "Miễn phí", tier: "free", cycle: "freemium", price: 0, currency: "₫", period: "")
        )
        persist(user: user)
        defaults.removeObject(forKey: "iflux_pending_register")
    }

    func logout() {
        session = nil
        defaults.removeObject(forKey: StorageKeys.session)
    }

    private struct PendingRegistration: Codable {
        var email: String
        var password: String
        var displayName: String
    }

    enum AuthError: LocalizedError {
        case invalidInput
        case invalidCredentials
        case invalidOtp
        case noPendingRegistration

        var errorDescription: String? {
            switch self {
            case .invalidInput: return "Vui lòng nhập đầy đủ thông tin."
            case .invalidCredentials: return "Email/SĐT hoặc mật khẩu không đúng."
            case .invalidOtp: return "Mã OTP không hợp lệ."
            case .noPendingRegistration: return "Không có đăng ký đang chờ xác thực."
            }
        }
    }

    private func findDemoUser(email: String, password: String) -> IfxUser? {
        guard password == StorageKeys.demoPassword else { return nil }
        if email == "minh@iflux.vn" {
            return IfxUser(
                id: "user-demo",
                email: email,
                phone: "0912345678",
                displayName: "Minh Demo",
                tier: "premium",
                tierLabel: "Premium",
                subscriptionPhase: "paid",
                plan: IfxUserPlan(name: "Premium", tier: "premium", cycle: "monthly", price: 299000, currency: "₫", period: "/tháng")
            )
        }
        return nil
    }

    private func persist(user: IfxUser) {
        let newSession = IfxSession(user: user, token: "sandbox-jwt-\(user.id)")
        session = newSession
        if let data = try? JSONEncoder().encode(newSession) {
            defaults.set(data, forKey: StorageKeys.session)
        }
    }

    private func loadSession() -> IfxSession? {
        guard let data = defaults.data(forKey: StorageKeys.session),
              let decoded = try? JSONDecoder().decode(IfxSession.self, from: data) else {
            return nil
        }
        return decoded
    }
}
