Indicates the type of an OTP.
- `account_verification`: Type of OTPs to verify a user's account. For example when a user created a new account, and wants to resend a new OTP for verifying the created account, an OTP with this type must be generated.
- `password_reset`: Type of OTPs that are used to reset an account's password.
- `two_factor`: It is for two factor authentication. When a user wants to sign in to an account with enabled two factor, or wants to do some sensitive actions, an OTP with this type must be created.  