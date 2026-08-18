package vn.iflux.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import vn.iflux.app.core.service.AuthRepository
import vn.iflux.app.ui.components.IfxBrandName
import vn.iflux.app.ui.components.IfxPrimaryButton
import vn.iflux.app.ui.theme.IfxColors

@Composable
fun LoginScreen(auth: AuthRepository) {
    var modeEmail by remember { mutableStateOf(true) }
    var email by remember { mutableStateOf("minh@iflux.vn") }
    var phone by remember { mutableStateOf("0912345678") }
    var password by remember { mutableStateOf("Demo@1234") }
    var error by remember { mutableStateOf<String?>(null) }

    Column(
        Modifier
            .fillMaxSize()
            .background(IfxColors.Surface)
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        IfxBrandName()
        Text("Đăng nhập", color = IfxColors.TextPrimary, fontSize = 24.sp)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            FilterChip(selected = modeEmail, onClick = { modeEmail = true }, label = { Text("Email") })
            FilterChip(selected = !modeEmail, onClick = { modeEmail = false }, label = { Text("SĐT") })
        }
        if (modeEmail) {
            OutlinedTextField(email, { email = it }, label = { Text("Email") }, modifier = Modifier.fillMaxWidth())
        } else {
            OutlinedTextField(phone, { phone = it }, label = { Text("Số điện thoại") }, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth())
        }
        OutlinedTextField(password, { password = it }, label = { Text("Mật khẩu") }, visualTransformation = PasswordVisualTransformation(), modifier = Modifier.fillMaxWidth())
        error?.let { Text(it, color = IfxColors.Negative, fontSize = 13.sp) }
        IfxPrimaryButton("Đăng nhập") {
            val result = if (modeEmail) auth.loginEmail(email, password) else auth.loginPhone(phone, password)
            result.onFailure { error = it.message }.onSuccess { error = null }
        }
        Text("Demo: minh@iflux.vn / Demo@1234", color = IfxColors.TextSecondary, fontSize = 11.sp)
    }
}
