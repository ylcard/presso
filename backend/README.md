# BudgetWise Backend API

Express.js REST API for BudgetWise - A personal finance management application implementing the 50/30/20 budgeting methodology.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with secure password hashing
- **Transaction Management**: Full CRUD for income and expenses with advanced filtering
- **Category System**: Custom categorization with financial priority assignment (Needs/Wants/Savings)
- **Budget Management**:
  - Budget Goals (50/30/20 methodology)
  - System Budgets (auto-generated)
  - Custom Budgets with category allocations
  - Mini Budgets for specific projects
- **Cash Wallet**: Separate tracking for cash transactions
- **User Settings**: Multi-currency support and display preferences
- **Exchange Rates**: Currency conversion management
- **Category Rules**: Auto-categorization rules for transaction import
- **Analytics**: Transaction statistics and financial breakdowns

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Security**: Helmet, CORS, Rate Limiting
- **Password Hashing**: bcryptjs

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🔧 Installation

1. **Install dependencies**:
```bash
npm install
```

2. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `FRONTEND_URL`: Your frontend application URL (for CORS)

3. **Set up the database**:

```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed
```

## 🚦 Running the Server

### Development mode (with hot reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

The server will start on `http://localhost:5000` (or your configured PORT)

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login user | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/auth/logout` | Logout user | Yes |

### Transaction Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/transactions` | Get all transactions (with filtering) | Yes |
| GET | `/transactions/:id` | Get single transaction | Yes |
| POST | `/transactions` | Create transaction | Yes |
| PUT | `/transactions/:id` | Update transaction | Yes |
| DELETE | `/transactions/:id` | Delete transaction | Yes |
| GET | `/transactions/stats/summary` | Get transaction statistics | Yes |

### Category Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/categories` | Get all categories | Yes |
| GET | `/categories/:id` | Get single category | Yes |
| POST | `/categories` | Create category | Yes |
| PUT | `/categories/:id` | Update category | Yes |
| DELETE | `/categories/:id` | Delete category | Yes |
| GET | `/categories/:id/transactions` | Get category transactions | Yes |

### Budget Goal Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/budget-goals` | Get all budget goals | Yes |
| GET | `/budget-goals/:priority` | Get goal by priority | Yes |
| POST | `/budget-goals` | Create budget goal | Yes |
| PUT | `/budget-goals/:id` | Update budget goal | Yes |
| DELETE | `/budget-goals/:id` | Delete budget goal | Yes |

### System Budget Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/system-budgets` | Get all system budgets | Yes |
| GET | `/system-budgets/:id` | Get single system budget | Yes |
| POST | `/system-budgets` | Create system budget | Yes |
| PUT | `/system-budgets/:id` | Update system budget | Yes |
| DELETE | `/system-budgets/:id` | Delete system budget | Yes |

### Custom Budget Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/custom-budgets` | Get all custom budgets | Yes |
| GET | `/custom-budgets/:id` | Get single custom budget | Yes |
| POST | `/custom-budgets` | Create custom budget | Yes |
| PUT | `/custom-budgets/:id` | Update custom budget | Yes |
| DELETE | `/custom-budgets/:id` | Delete custom budget | Yes |
| GET | `/custom-budgets/:id/allocations` | Get budget allocations | Yes |
| POST | `/custom-budgets/:id/allocations` | Add allocation | Yes |
| PUT | `/custom-budgets/:budgetId/allocations/:allocationId` | Update allocation | Yes |
| DELETE | `/custom-budgets/:budgetId/allocations/:allocationId` | Delete allocation | Yes |

### Mini Budget Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/mini-budgets` | Get all mini budgets | Yes |
| GET | `/mini-budgets/:id` | Get single mini budget | Yes |
| POST | `/mini-budgets` | Create mini budget | Yes |
| PUT | `/mini-budgets/:id` | Update mini budget | Yes |
| DELETE | `/mini-budgets/:id` | Delete mini budget | Yes |

### Settings Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/settings` | Get user settings | Yes |
| PUT | `/settings` | Update user settings | Yes |

### Exchange Rate Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/exchange-rates` | Get all exchange rates | Yes |
| GET | `/exchange-rates/:id` | Get single exchange rate | Yes |
| POST | `/exchange-rates` | Create exchange rate | Yes |
| PUT | `/exchange-rates/:id` | Update exchange rate | Yes |
| DELETE | `/exchange-rates/:id` | Delete exchange rate | Yes |

### Cash Wallet Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cash-wallet` | Get cash wallet | Yes |
| PUT | `/cash-wallet` | Update cash wallet amount | Yes |
| POST | `/cash-wallet/deposit` | Deposit to wallet | Yes |
| POST | `/cash-wallet/withdraw` | Withdraw from wallet | Yes |

### Category Rule Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/category-rules` | Get all category rules | Yes |
| GET | `/category-rules/:id` | Get single category rule | Yes |
| POST | `/category-rules` | Create category rule | Yes |
| PUT | `/category-rules/:id` | Update category rule | Yes |
| DELETE | `/category-rules/:id` | Delete category rule | Yes |

## 🔒 Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

After successful login/registration, you'll receive a token in the response. Include this token in subsequent requests.

## 📊 Database Schema

The database includes the following main entities:

- **User**: User accounts and authentication
- **Transaction**: Income and expense records
- **Category**: Expense categorization with priority
- **BudgetGoal**: Financial targets (Needs/Wants/Savings)
- **SystemBudget**: Auto-generated monthly budgets
- **CustomBudget**: User-defined budgets with allocations
- **MiniBudget**: Simplified budget tracking
- **UserSettings**: User preferences and configuration
- **ExchangeRate**: Currency conversion rates
- **CashWallet**: Cash transaction tracking
- **CategoryRule**: Auto-categorization rules

## 🧪 Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and apply migrations
npm run db:migrate

# Push schema to database (without migrations)
npm run db:push

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🔍 Error Handling

The API uses consistent error responses:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request / Validation Error
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (e.g., duplicate entry)
- `429`: Too Many Requests (rate limit)
- `500`: Internal Server Error

## 🛡️ Security Features

- **Helmet**: Sets various HTTP headers for security
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs with salt rounds
- **Input Validation**: Zod schema validation on all inputs
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRE` | JWT expiration time | `30d` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
