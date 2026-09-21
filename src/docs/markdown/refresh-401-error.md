When the API returns a `401` response, the session, refresh token, and access token will be deleted. This status indicates token expiration, manual revocation, suspicious activity, etc.  
Error codes:

- `0`: The refresh token has expired.
- `1`: Something suspicious occurred with the refresh token. For example, the token's signature is invalid, its payload has been modified, etc. This error code usually means that someone is trying to get an access token illegally. The `message` property in the response body provides additional context.
- `2`: For now, this code doesn't occur, but it may be implemented in the future. It is reserved for the JWT `nbf` (Not Before) claim, which indicates that the refresh token is not valid before a specified timestamp. The `message` property in the response body provides additional context.
- `4`: The session associated with the refresh token does not exist, indicating that the session was revoked (by the user or an admin).
- `5`: The refresh token stored in the associated session doesn't match the sent refresh token.
