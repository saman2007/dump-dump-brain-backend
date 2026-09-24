An API to revoke a user's session.

- Note: When users revoke one of their active sessions, the revoked session's refresh token can't be used anymore. However, the associated access token may remain valid and usable for up to 15 minutes. The API endpoints don't validate the session status of incoming access tokens because the endpoints do not handle highly sensitive data. Because of it, checking every access token is not worth the added performance overhead
