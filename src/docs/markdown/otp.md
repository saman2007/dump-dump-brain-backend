A user to do some actions like verifying a new account, resetting password, signing in to an account with two factor enabled and etc, must enter a verification code.  
To send a verification code, first you must generate an OTP. To do this, see [generate OTP API doc](/docs#tag/otp/POST/otp/generate).  
After that, user should enter the verification code that is sent to it's email. To do this, see [OTP API to enter a verification code](/docs#tag/otp/POST/otp/attempt).  
After the verification code is approved, the appropriate action will be done.

OTP details:

- A generated OTP has 6 digits.
- It is valid for 5 minutes since it is generated.
- A user can send verification codes for 5 times. After that, user must request to generate a new OTP.
