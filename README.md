# BudgetWise - Personal Finance Management Application

A full-stack personal finance management application implementing the 50/30/20 budgeting methodology (Needs/Wants/Savings).

## 📁 Project Structure

```
budgetwise/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── contexts/      # React contexts
│   │   └── pages/         # Page components
│   ├── package.json
│   └── vite.config.js
│
└── backend/           # Express.js REST API
    ├── src/
    │   ├── controllers/   # Route controllers
    │   ├── routes/        # API routes
    │   ├── middleware/    # Express middleware
    │   ├── validations/   # Zod validation schemas
    │   ├── app.js        # Express app configuration
    │   └── server.js     # Server entry point
    ├── prisma/
    │   └── schema.prisma  # Database schema
    └── package.json
```

## 🚀 Features

### Frontend
- **Dashboard**: Real-time financial overview with budget visualization
- **Transactions**: Full CRUD operations with advanced filtering
- **Categories**: Custom categorization with financial priority
- **Budgets**: System budgets, custom budgets, and mini budgets
- **Reports**: Analytics with charts and financial health scores
- **Settings**: Multi-currency support and display preferences
- **Data Import**: CSV/PDF upload with auto-categorization
- **Cash Wallet**: Separate cash transaction tracking

### Backend
- **RESTful API**: Complete REST API with Express.js
- **Authentication**: JWT-based auth with secure password hashing
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod schema validation
- **Security**: Helmet, CORS, rate limiting
- **Error Handling**: Comprehensive error handling middleware

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- React Router
- TanStack Query (React Query)
- Tailwind CSS
- Radix UI
- Recharts
- date-fns
- Zod

### Backend
- Node.js
- Express.js
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Zod Validation
- bcryptjs

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🔧 Installation & Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd budgetwise
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env and configure:
# - DATABASE_URL (PostgreSQL connection string)
# - JWT_SECRET (secure random string)
# - FRONTEND_URL (for CORS)

# Generate Prisma Client
npm run db:generate

# Run database migrations
npm run db:migrate

# (Optional) Seed the database
npm run db:seed

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🚦 Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## 📚 API Documentation

Base URL: `http://localhost:5000/api`

### Main Endpoints

- **Auth**: `/api/auth` - Authentication (register, login, me)
- **Transactions**: `/api/transactions` - Transaction management
- **Categories**: `/api/categories` - Category management
- **Budget Goals**: `/api/budget-goals` - Financial targets
- **System Budgets**: `/api/system-budgets` - Auto-generated budgets
- **Custom Budgets**: `/api/custom-budgets` - User-defined budgets
- **Mini Budgets**: `/api/mini-budgets` - Simple budget tracking
- **Settings**: `/api/settings` - User preferences
- **Exchange Rates**: `/api/exchange-rates` - Currency rates
- **Cash Wallet**: `/api/cash-wallet` - Cash tracking
- **Category Rules**: `/api/category-rules` - Auto-categorization

See `/backend/README.md` for detailed API documentation.

## 🗄️ Database Schema

Main entities:
- User
- Transaction
- Category
- BudgetGoal
- SystemBudget
- CustomBudget & CustomBudgetAllocation
- MiniBudget
- UserSettings
- ExchangeRate
- CashWallet
- CategoryRule

## 🔐 Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/budgetwise
JWT_SECRET=your-secret-key
JWT_EXPIRE=30d
FRONTEND_URL=http://localhost:5173
```

### Frontend
Currently using environment variables from the Base44 SDK. Update to use your backend URL in the API client configuration.

## 🧪 Database Commands

```bash
cd backend

# Generate Prisma Client
npm run db:generate

# Create migrations
npm run db:migrate

# Push schema (without migrations)
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio (GUI)
npm run db:studio
```

## 📦 Available Scripts

### Backend
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:generate` - Generate Prisma Client
- `npm run db:push` - Push schema to database
- `npm run db:seed` - Seed database
- `npm run db:studio` - Open Prisma Studio

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcryptjs
- CORS protection
- Rate limiting (100 requests/15min)
- Helmet security headers
- Input validation with Zod
- SQL injection protection via Prisma

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name

## 🙏 Acknowledgments

- React and Vite teams
- Express.js community
- Prisma team
- All open-source contributors
