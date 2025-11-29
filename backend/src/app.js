import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { notFound, errorHandler } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetGoalRoutes from './routes/budgetGoalRoutes.js';
import systemBudgetRoutes from './routes/systemBudgetRoutes.js';
import customBudgetRoutes from './routes/customBudgetRoutes.js';
import miniBudgetRoutes from './routes/miniBudgetRoutes.js';
import userSettingsRoutes from './routes/userSettingsRoutes.js';
import exchangeRateRoutes from './routes/exchangeRateRoutes.js';
import cashWalletRoutes from './routes/cashWalletRoutes.js';
import categoryRuleRoutes from './routes/categoryRuleRoutes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

app.use('/api/', limiter);

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BudgetWise API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budget-goals', budgetGoalRoutes);
app.use('/api/system-budgets', systemBudgetRoutes);
app.use('/api/custom-budgets', customBudgetRoutes);
app.use('/api/mini-budgets', miniBudgetRoutes);
app.use('/api/settings', userSettingsRoutes);
app.use('/api/exchange-rates', exchangeRateRoutes);
app.use('/api/cash-wallet', cashWalletRoutes);
app.use('/api/category-rules', categoryRuleRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app;
