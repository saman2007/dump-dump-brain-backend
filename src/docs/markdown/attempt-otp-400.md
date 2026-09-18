Error codes that can be returned in a `400` response:

- `0`: When the user attempts to verify a code for an OTP that does not exist for the specified user or does not match the specified type.
- `1`: When the user attempts to send a verification code 5 or more times and all attempts fail.
- `2`: When the user attempts to verify a code for an expired OTP.
- `4`: When the user attempts to verify a code that doesn't match the generated OTP. In this case, the `data` property in response body is a `boolean` indicating whether the user has exceeded the maximum number of attempts or not.
