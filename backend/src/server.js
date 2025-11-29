import dotenv from 'dotenv';
import app from './app.js';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

// Test database connection
async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

// Start server
async function startServer() {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log('🚀 BudgetWise API Server');
      console.log(`📡 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Shutting down gracefully...');
  await prisma.$disconnect();
  console.log('✅ Database disconnected');
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (err) => {
  console.error('Unhandled Promise Rejection:', err);
  await prisma.$disconnect();
  process.exit(1);
});

startServer();
