package vn.iflux.app.core.service

import android.content.Context
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import vn.iflux.app.core.model.IfxSession
import vn.iflux.app.core.model.IfxUser

class AuthRepository(context: Context) {
    private val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)

    var session by mutableStateOf<IfxSession?>(loadSession())
        private set

    val isLoggedIn: Boolean get() = session != null

    fun loginEmail(email: String, password: String): Result<Unit> {
        val normalized = email.trim().lowercase()
        if (normalized.isEmpty() || password.isEmpty()) return Result.failure(IllegalArgumentException("Vui lòng nhập đầy đủ thông tin."))
        if (normalized == "minh@iflux.vn" && password == DEMO_PASSWORD) {
            persist(demoUser())
            return Result.success(Unit)
        }
        return Result.failure(IllegalArgumentException("Email/SĐT hoặc mật khẩu không đúng."))
    }

    fun loginPhone(phone: String, password: String): Result<Unit> {
        val digits = phone.filter { it.isDigit() }
        if (digits.length < 9 || password.isEmpty()) return Result.failure(IllegalArgumentException("Vui lòng nhập đầy đủ thông tin."))
        if (password == DEMO_PASSWORD && (digits.endsWith("912345678") || digits == "84912345678")) {
            persist(demoUser())
            return Result.success(Unit)
        }
        return Result.failure(IllegalArgumentException("Email/SĐT hoặc mật khẩu không đúng."))
    }

    fun logout() {
        session = null
        prefs.edit().remove(KEY_SESSION).apply()
    }

    private fun demoUser() = IfxUser(
        id = "user-demo",
        email = "minh@iflux.vn",
        phone = "0912345678",
        displayName = "Minh Demo",
        tier = "premium",
        tierLabel = "Premium"
    )

    private fun persist(user: IfxUser) {
        val newSession = IfxSession(user, "sandbox-jwt-${user.id}")
        session = newSession
        prefs.edit().putString(KEY_SESSION, "${user.id}|${user.email}|${user.displayName}|${user.tier}").apply()
    }

    private fun loadSession(): IfxSession? {
        val raw = prefs.getString(KEY_SESSION, null) ?: return null
        val parts = raw.split("|")
        if (parts.size < 4) return null
        return IfxSession(
            IfxUser(parts[0], parts[1], null, parts[2], parts[3], parts[3]),
            "sandbox-jwt-${parts[0]}"
        )
    }

    companion object {
        private const val PREFS = "iflux_app"
        private const val KEY_SESSION = "iflux_user_session"
        private const val DEMO_PASSWORD = "Demo@1234"
    }
}
