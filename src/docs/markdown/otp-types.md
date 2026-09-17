Indicates the type of the generating OTP.
- `account_verification`: It is for generating OTP to verify user's account. When a user created a new account, and wants to resend a new OTP for verifying the created account, an OTP with this type must be generated.
- `password_reset`: It is for generating OTP when a user wants to reset an account's password.
- `two_factor`: It is for two factor authentication. When a user wants to sign in to an account with enabled two factor, or wants to do some sensitive actions, an OTP with this type must be created.  