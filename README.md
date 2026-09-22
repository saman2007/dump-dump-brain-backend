# Dump Dump Brain — Backend API

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-ISC-green)
![Node](https://img.shields.io/badge/node-%3E%3D22-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-7%2B-blue)

**Dump Dump Brain** is a social platform for dumping your brain — a place to post thoughts, ideas, and whatever is running through your mind, similar to Twitter but more personal. It will also include a blog section for longer-form writing. This repository contains the backend REST API.

---

## Features

- **Authentication** — Sign up, sign in, and sign out with session-based auth
- **Two-Factor Authentication (2FA)** — Optional 2FA flow at sign-in
- **OTP System** — Generate and verify one-time passwords for some actions (sign in, account verification, etc.)
- **Token Rotation** — Refresh access tokens securely using rotating refresh tokens
- **Interactive API Docs** — Powered by Scalar, available on a dedicated dev docs server

---

## Tech Stack

- **[Express 5](https://expressjs.com/)** — Implementing API endpoints
- **[TypeScript](https://www.typescriptlang.org/)**
- **[PostgreSQL](https://www.postgresql.org/)**
- **[Drizzle ORM](https://orm.drizzle.team/)** — A great ORM for database querying
- **[Zod](https://zod.dev/)** — For validation
- **[JSON Web Tokens (JWT)](https://jwt.io/)**
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** — For hashing high security data
- **[EmailJS](https://www.emailjs.com/)** — Email delivery
- **[Scalar](https://scalar.com/) + [zod-to-openapi](https://github.com/asteasolutions/zod-to-openapi)** — OpenAPI spec generation & interactive docs
- **[Bruno](https://www.usebruno.com/)** — API collection for local testing

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (Written and tested in version 22.20.0)
- [PostgreSQL](https://www.postgresql.org/) (running locally or remotely)

### 1. Clone the repository

```bash
git clone https://github.com/saman2007/dump-dump-brain-backend.git
cd dump-dump-brain-backend
```

### 2. Install dependencies

```bash
pnpm install
```

or

```bash
npm install
```

or the install command of any package manager you use.

### 3. Set up PostgreSQL

Create a new database for the project.

### 4. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Each variable is documented with a comment directly in `.env.example`. Fill in your values before starting the server.

### 5. Run database migrations

```bash
npx drizzle-kit migrate
```

### 6. Setup EmailJS

I use EmailJS service to send emails, because I found it easy and free to use. Here is how you can set up your EmailJS service:

1. Create an account on [EmailJS](https://www.emailjs.com/).
2. Go to Email Services > Add New Service, and add your service fromthere. I used Gmail from Personal Services. Store your service id in the `.env` file as explained in `.env.example` file.
3. Go to Email Templates > Create New Template. Choose a template from the menu, which we will customize.
4. Go to your created template. From the content tab, change the value of these inputs: `Subject`, `Content`, `To Email`, `FromName` to these values: `{{subject}}`, `{{{html}}}`, `{{to}}`, `{{fromName}}`. Enable the `Use Default Email Address` checkbox and leave the other fields empty.
5. Now go to the Settings tab and change the value of Template ID to `main-template`. Then save the changes.
6. From the sidebar, go to Account > Security and enable `AllowEmailJS API for non-browser applications.` and `Use Private Key(recommended)` checkboxes. From the General tab, get your public and private keys and store them in the `.env` file as explained in `.env.example`.
7. You are done! Note that the emails may be sent to the spam folder of the destination email.

### 7. Start the dev server

```bash
# Start the API server
npm run dev:app

# Start the interactive docs server (in a separate terminal)
npm run dev:doc
```

The API will be available at `http://localhost:3000` and the interactive docs at `http://localhost:3001` by default.

---

## API Documentation

Once the docs server is running (`npm run dev:doc`), open **http://localhost:3001** in your browser to explore all available documentations for the APIs, the flows in the app(e.g. Auth flow), and etc.

---

## Testing with Bruno

A Bruno workspace is included in the `bruno-storage/` directory. Open it in [Bruno](https://www.usebruno.com/) to run and test the API endpoints manually.

---

## Project Structure

```
src/
├── app.ts              # Express app entry point
├── controllers/        # Route handler logic
├── db/
│   ├── schemas/        # Drizzle table schemas
│   └── migrations/     # Auto-generated DB migrations
├── docs/               # Scalar/OpenAPI docs server and the document storage
├── middlewares/        # General middlewares(Validation, auth, etc)
├── routes/             # Express route definitions
├── services/           # Business logic & external service integrations
├── templates/          # Pug email templates
├── types/              # Shared TypeScript types
└── utils/              # Utility functions and data
```
