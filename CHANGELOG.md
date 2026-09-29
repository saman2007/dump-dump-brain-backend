# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2026-09-29

### Added
- Get user profile info API (`GET /user/info`).
- Update user profile API (`PATCH /user/info`).
- Follow user API (`POST /user/follow`) to follow other users.
- Unfollow user API (`POST /user/unfollow`) to unfollow users.
- Followers list API (`GET /user/followers-list`) with cursor-based pagination.
- Following list API (`GET /user/following-list`) with cursor-based pagination.
- `users_info` table for profile metadata linked to `users`.
- `follows` table for storing followers and following
- Seed script (`src/db/seed.ts`) to populate database with test users and follow relationships.
- `User` tag for users related APIs like user-info and follow APIs.
- Documents for new APIs.
- New APIs in bruno.

### Fixed
- Fixed query parameters handling in `validateRequestData` middleware.
- Updated `@scalar/express-api-reference` from version `0.10.21` to `0.10.23`.

## [1.1.0] - 2026-09-24

### Added
- Sessions API to get all active sessions of a user(`/session`)
- Revoke sessions API to revoke a user's active session(`/sessions/revoke`)
- Added `Session` tag to the docs
- Added docs for new APIs

### Fixed
- Improved the docs structures by adding validation error response to APIs that have validations
- Improved the docs by refactoring some schemas and texts

### Changed
- Updated scalar(`@scalar/express-api-reference`) from version `0.10.19` to `0.10.21`

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