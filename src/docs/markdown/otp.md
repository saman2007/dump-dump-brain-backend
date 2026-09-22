A user to do some actions like verifying a new account, resetting password, signing in to an account with two factor enabled and etc, must enter a verification code.  
To send a verification code, first you must generate an OTP. To do this, see [generate OTP API doc](/docs#tag/otp/POST/otp/generate). After generating an OTP, the code will be sent to user's email.   
After that, user should enter the verification code. To do this, see [OTP API to enter a verification code](/docs#tag/otp/POST/otp/attempt).  
After the verification code is approved, API returns an action key with the same type of OTP's type. After that, base on the type of action key, you can send it to related APIs to do a specific action like verifying an account, signing in and etc.  
Note: An action key is valid for 5 minutes and can be used only once.

OTP details:

- A generated OTP has 6 digits.
- It is valid for 5 minutes since it is generated.
- A user can send verification codes for 5 times. After that, user must request to generate a new OTP.
