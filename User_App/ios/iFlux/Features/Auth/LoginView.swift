import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var auth: AuthService
    @State private var mode: LoginMode = .email
    @State private var email = "minh@iflux.vn"
    @State private var phone = "0912345678"
    @State private var password = "Demo@1234"
    @State private var error: String?
    @State private var showRegister = false

    enum LoginMode: String, CaseIterable {
        case email = "Email"
        case phone = "SĐT"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: IfxTokens.space5) {
                IfxBrandName()
                    .padding(.top, IfxTokens.space5)

                Text("Đăng nhập")
                    .font(.system(size: 24, weight: .bold))
                    .foregroundStyle(IfxTokens.textPrimary)

                Picker("Phương thức", selection: $mode) {
                    ForEach(LoginMode.allCases, id: \.self) { item in
                        Text(item.rawValue).tag(item)
                    }
                }
                .pickerStyle(.segmented)

                Group {
                    if mode == .email {
                        TextField("Email", text: $email)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                    } else {
                        TextField("Số điện thoại", text: $phone)
                            .keyboardType(.phonePad)
                    }
                    SecureField("Mật khẩu", text: $password)
                }
                .padding(12)
                .background(IfxTokens.surfaceElevated)
                .clipShape(RoundedRectangle(cornerRadius: IfxTokens.radiusSm))
                .foregroundStyle(IfxTokens.textPrimary)

                if let error {
                    Text(error)
                        .font(.system(size: 13))
                        .foregroundStyle(IfxTokens.negative)
                }

                IfxPrimaryButton(title: "Đăng nhập") {
                    do {
                        if mode == .email {
                            try auth.login(email: email, password: password)
                        } else {
                            try auth.login(phone: phone, password: password)
                        }
                        error = nil
                    } catch {
                        self.error = error.localizedDescription
                    }
                }

                Button("Chưa có tài khoản? Đăng ký") {
                    showRegister = true
                }
                .foregroundStyle(IfxTokens.brandPrimary)

                NavigationLink(destination: RegisterView(), isActive: $showRegister) {
                    EmptyView()
                }
                .hidden()

                Text("Demo: minh@iflux.vn / Demo@1234 · OTP: 123456")
                    .font(.system(size: 11))
                    .foregroundStyle(IfxTokens.textSecondary)
                    .multilineTextAlignment(.center)

                Spacer()
            }
            .padding(IfxTokens.space4)
            .background(IfxTokens.surface.ignoresSafeArea())
        }
        .navigationViewStyle(.stack)
    }
}

struct RegisterView: View {
    @EnvironmentObject private var auth: AuthService
    @Environment(\.presentationMode) private var presentationMode
    @State private var email = ""
    @State private var displayName = ""
    @State private var password = ""
    @State private var otp = ""
    @State private var step: Step = .form
    @State private var error: String?

    enum Step { case form, otp }

    var body: some View {
        VStack(spacing: IfxTokens.space4) {
            IfxBrandName()
            Text(step == .form ? "Đăng ký" : "Xác thực OTP")
                .font(.system(size: 22, weight: .bold))
                .foregroundStyle(IfxTokens.textPrimary)

            if step == .form {
                TextField("Email", text: $email)
                TextField("Họ tên", text: $displayName)
                SecureField("Mật khẩu", text: $password)
            } else {
                TextField("Mã OTP (demo: 123456)", text: $otp)
                    .keyboardType(.numberPad)
            }

            if let error {
                Text(error).foregroundStyle(IfxTokens.negative).font(.system(size: 13))
            }

            IfxPrimaryButton(title: step == .form ? "Tiếp tục" : "Hoàn tất") {
                if step == .form {
                    _ = auth.register(email: email, password: password, displayName: displayName.isEmpty ? "Nhà đầu tư mới" : displayName)
                    step = .otp
                } else {
                    do {
                        try auth.verifyOtp(otp)
                        presentationMode.wrappedValue.dismiss()
                    } catch {
                        self.error = error.localizedDescription
                    }
                }
            }
            Spacer()
        }
        .padding(IfxTokens.space4)
        .background(IfxTokens.surface.ignoresSafeArea())
    }
}
