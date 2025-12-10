

````markdown
# 🏦 HNG Stage 8: Wallet Service with Paystack & API Keys

A robust Fintech-grade backend service built with **NestJS**. This application provides a complete digital wallet system allowing users to authenticate via Google, deposit funds using **Paystack**, transfer money to other users, and manage access via **API Keys**.

**🚀 Live URL:** [https://stage-8-backend.onrender.com] 
**📄 Swagger Documentation:** [https://stage-8-backend.onrender.com/api]

---

## ✨ Features

### 🔐 Authentication & Security
* **Google OAuth 2.0:** Secure user login via Google.
* **Dual Authentication:** Supports both **JWT** (for users) and **API Keys** (for service-to-service access).
* **API Key Management:** Users can generate keys with specific permissions (`read`, `deposit`, `transfer`) and expiration times (`1H`, `1D`, `1M`, `1Y`).
* **Role-Based Access Control:** Strict permission enforcement on all endpoints.

### 💰 Wallet Operations
* **Auto-Wallet Creation:** Automatically assigns a wallet to new users upon sign-up.
* **Deposits:** Secure integration with **Paystack** to fund wallets.
* **Transfers:** Atomic wallet-to-wallet transactions with rollback protection (ACID compliant).
* **Idempotency:** Webhooks handle duplicate events gracefully to prevent double-crediting.
* **Currency Handling:** Accepts Naira inputs, processes in Kobo (Safe Integer Math).

---

## 🛠️ Tech Stack

* **Framework:** [NestJS](https://nestjs.com/) (Node.js)
* **Database:** PostgreSQL
* **ORM:** TypeORM
* **Payment Gateway:** Paystack
* **Documentation:** Swagger (OpenAPI)
* **Deployment:** Render

---

## 🚀 Setup & Installation

### 1. Clone the Repository
```bash
git clone [https://github.com/Emmavoen/stage-8-backend.git]
cd stage-8-backend
````

### 2\. Install Dependencies

```bash
npm install
```

### 3\. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=wallet_db

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Security
JWT_SECRET=super_secret_key_123

# Paystack (Payments)
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxx
```

### 4\. Run the Application

```bash
# Development
npm run start:dev

# Production Build
npm run build
npm run start:prod
```

The server will start on `http://localhost:3000`.

-----

## 📡 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/auth/google` | Triggers Google Sign-In flow. |
| `GET` | `/auth/google/callback` | Returns the **JWT Token** and User info. |

### 🔑 API Keys

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/keys/create` | Generates a new API Key with specific permissions. |
| `POST` | `/keys/rollover` | Replaces an expired key with a new one (same permissions). |

### 💳 Wallet & Transactions

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/wallet/balance` | Returns current wallet balance and number. |
| `POST` | `/wallet/deposit` | Initiates a Paystack transaction. Returns checkout URL. |
| `POST` | `/wallet/transfer` | Transfers funds to another wallet number. |
| `GET` | `/wallet/transactions` | Returns full transaction history. |
| `POST` | `/wallet/paystack/webhook` | Handles Paystack events (e.g., `charge.success`) to credit wallets. |

-----

## 🧪 Testing Workflow

1.  **Login:** Visit `/auth/google` to sign in. Copy the **JWT Token**.
2.  **Authorize:** In Postman or Swagger, click **"Authorize"** and paste the token as `Bearer <token>`.
3.  **Check Balance:** Call `GET /wallet/balance`. Note your `wallet_number`.
4.  **Deposit:** Call `POST /wallet/deposit` with `{ "amount": 500 }` (Naira).
5.  **Pay:** Click the returned `authorization_url` to complete payment.
6.  **Transfer:** Use a second account's wallet number to test `POST /wallet/transfer`.

-----


```
```
