# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-09-22

### Added
- Auth flow implementation
- Sign-Up API(`/auth/signup`)
- Sign-In API(`/auth/signin`)
- Sign-In API for users who has enabled 2FA for their account(`/auth/signin/2fa`)
- Refresh API for rotating refresh token and refreshing access token(`/auth/refresh`)
- OTP flow implementation
- OTP generate API for generating OTPs for sign in, verifying account and etc(`/otp/generate`)
- OTP attempt API for attempting to verify the generated OTPs(`/otp/attempt`)
- Account verify API(`/account/verify`) 
- Bruno workspace for testing API endpoints
- Documents for the implemented APIs and details about sections using `@scalar/express-api-reference` and `@asteasolutions/zod-to-openapi`
- `users` table for storing users data
- `sessions` table for implementing session base authentication flow
- `otps` table for generating and verifying OTPs
- `action_keys` table for generating keys that make it possible to do some actions like signing in, verifying accounts and etc
- A basic `README.md`
- `.env.example` with key descriptions