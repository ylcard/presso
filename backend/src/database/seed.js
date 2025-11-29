import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning up existing data...');
  await prisma.categoryRule.deleteMany();
  await prisma.customBudgetAllocation.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customBudget.deleteMany();
  await prisma.miniBudget.deleteMany();
  await prisma.systemBudget.deleteMany();
  await prisma.budgetGoal.deleteMany();
  await prisma.cashWallet.deleteMany();
  await prisma.userSettings.deleteMany();
  await prisma.user.deleteMany();
  await prisma.exchangeRate.deleteMany();

  // Create demo user
  console.log('👤 Creating demo user...');
  const hashedPassword = await bcrypt.hash('demo123', 10);

  const user = await prisma.user.create({
    data: {
      email: 'demo@budgetwise.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });

  console.log('✅ Demo user created:', user.email);

  // Create user settings
  console.log('⚙️ Creating user settings...');
  await prisma.userSettings.create({
    data: {
      userId: user.id,
      baseCurrency: 'USD',
      currencyPosition: 'before',
      thousandSeparator: ',',
      decimalSeparator: '.',
      decimalPlaces: 2,
      hideTrailingZeros: false,
      dateFormat: 'MMM dd, yyyy',
      budgetViewMode: 'bars',
      fixedLifestyleMode: false,
      goalMode: true, // Percentage mode
    },
  });

  // Create budget goals (50/30/20 rule)
  console.log('🎯 Creating budget goals (50/30/20)...');
  await prisma.budgetGoal.createMany({
    data: [
      {
        userId: user.id,
        priority: 'needs',
        target_percentage: 50,
        is_absolute: false,
      },
      {
        userId: user.id,
        priority: 'wants',
        target_percentage: 30,
        is_absolute: false,
      },
      {
        userId: user.id,
        priority: 'savings',
        target_percentage: 20,
        is_absolute: false,
      },
    ],
  });

  // Create cash wallet
  console.log('💵 Creating cash wallet...');
  await prisma.cashWallet.create({
    data: {
      userId: user.id,
      amount: 500.00,
    },
  });

  // Create categories
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    // Needs
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Housing',
        icon: '🏠',
        color: '#3B82F6',
        priority: 'needs',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Groceries',
        icon: '🛒',
        color: '#3B82F6',
        priority: 'needs',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Utilities',
        icon: '💡',
        color: '#3B82F6',
        priority: 'needs',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Transportation',
        icon: '🚗',
        color: '#3B82F6',
        priority: 'needs',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Healthcare',
        icon: '🏥',
        color: '#3B82F6',
        priority: 'needs',
      },
    }),
    // Wants
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Entertainment',
        icon: '🎬',
        color: '#F59E0B',
        priority: 'wants',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Dining Out',
        icon: '🍽️',
        color: '#F59E0B',
        priority: 'wants',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Shopping',
        icon: '🛍️',
        color: '#F59E0B',
        priority: 'wants',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Hobbies',
        icon: '🎨',
        color: '#F59E0B',
        priority: 'wants',
      },
    }),
    // Savings
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Emergency Fund',
        icon: '🏦',
        color: '#10B981',
        priority: 'savings',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Investments',
        icon: '📈',
        color: '#10B981',
        priority: 'savings',
      },
    }),
    prisma.category.create({
      data: {
        userId: user.id,
        name: 'Retirement',
        icon: '🏖️',
        color: '#10B981',
        priority: 'savings',
      },
    }),
  ]);

  console.log(`✅ Created ${categories.length} categories`);

  // Create sample transactions
  console.log('💰 Creating sample transactions...');
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Income
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        title: 'Monthly Salary',
        amount: 5000,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        type: 'income',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
      },
      {
        userId: user.id,
        title: 'Freelance Project',
        amount: 1200,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
        type: 'income',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
      },
    ],
  });

  // Expenses - Needs
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categories[0].id, // Housing
        title: 'Rent Payment',
        amount: 1500,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        financial_priority: 'needs',
      },
      {
        userId: user.id,
        categoryId: categories[1].id, // Groceries
        title: 'Weekly Groceries',
        amount: 150,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 5),
        financial_priority: 'needs',
      },
      {
        userId: user.id,
        categoryId: categories[2].id, // Utilities
        title: 'Electricity Bill',
        amount: 120,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10),
        financial_priority: 'needs',
      },
      {
        userId: user.id,
        categoryId: categories[3].id, // Transportation
        title: 'Gas',
        amount: 80,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 12),
        financial_priority: 'needs',
      },
    ],
  });

  // Expenses - Wants
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categories[5].id, // Entertainment
        title: 'Netflix Subscription',
        amount: 15.99,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        financial_priority: 'wants',
      },
      {
        userId: user.id,
        categoryId: categories[6].id, // Dining Out
        title: 'Restaurant Dinner',
        amount: 85,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 14),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 14),
        financial_priority: 'wants',
      },
      {
        userId: user.id,
        categoryId: categories[7].id, // Shopping
        title: 'New Shoes',
        amount: 120,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 18),
        type: 'expense',
        isPaid: false,
        financial_priority: 'wants',
      },
    ],
  });

  // Expenses - Savings
  await prisma.transaction.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categories[9].id, // Emergency Fund
        title: 'Emergency Fund Contribution',
        amount: 500,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        financial_priority: 'savings',
      },
      {
        userId: user.id,
        categoryId: categories[10].id, // Investments
        title: 'Stock Purchase',
        amount: 300,
        date: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
        type: 'expense',
        isPaid: true,
        paidDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 15),
        financial_priority: 'savings',
      },
    ],
  });

  console.log('✅ Created sample transactions');

  // Create system budgets for current month
  console.log('📊 Creating system budgets...');
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

  await prisma.systemBudget.createMany({
    data: [
      {
        userId: user.id,
        name: 'Needs',
        budgetAmount: 3100, // 50% of 6200 income
        startDate: monthStart,
        endDate: monthEnd,
        color: '#3B82F6',
        systemBudgetType: 'needs',
      },
      {
        userId: user.id,
        name: 'Wants',
        budgetAmount: 1860, // 30% of 6200 income
        startDate: monthStart,
        endDate: monthEnd,
        color: '#F59E0B',
        systemBudgetType: 'wants',
      },
      {
        userId: user.id,
        name: 'Savings',
        budgetAmount: 1240, // 20% of 6200 income
        startDate: monthStart,
        endDate: monthEnd,
        color: '#10B981',
        systemBudgetType: 'savings',
      },
    ],
  });

  // Create a custom budget
  console.log('🎯 Creating custom budget...');
  const customBudget = await prisma.customBudget.create({
    data: {
      userId: user.id,
      name: 'Vacation Fund',
      allocatedAmount: 2000,
      startDate: monthStart,
      endDate: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 3, 0),
      status: 'active',
    },
  });

  // Add allocations to custom budget
  await prisma.customBudgetAllocation.createMany({
    data: [
      {
        customBudgetId: customBudget.id,
        categoryId: categories[5].id, // Entertainment
        allocatedAmount: 500,
      },
      {
        customBudgetId: customBudget.id,
        categoryId: categories[6].id, // Dining Out
        allocatedAmount: 800,
      },
      {
        customBudgetId: customBudget.id,
        categoryId: categories[7].id, // Shopping
        allocatedAmount: 700,
      },
    ],
  });

  // Create a mini budget
  console.log('💼 Creating mini budget...');
  await prisma.miniBudget.create({
    data: {
      userId: user.id,
      name: 'Home Office Setup',
      allocatedAmount: 500,
      startDate: monthStart,
      endDate: monthEnd,
      status: 'active',
    },
  });

  // Create category rules for auto-categorization
  console.log('📝 Creating category rules...');
  await prisma.categoryRule.createMany({
    data: [
      {
        userId: user.id,
        categoryId: categories[1].id, // Groceries
        keywords: ['walmart', 'kroger', 'whole foods', 'grocery', 'supermarket'],
        priority: 1,
      },
      {
        userId: user.id,
        categoryId: categories[3].id, // Transportation
        keywords: ['gas', 'fuel', 'uber', 'lyft', 'taxi', 'parking'],
        priority: 2,
      },
      {
        userId: user.id,
        categoryId: categories[6].id, // Dining Out
        keywords: ['restaurant', 'cafe', 'starbucks', 'mcdonalds', 'pizza'],
        priority: 3,
      },
    ],
  });

  // Create exchange rates
  console.log('💱 Creating exchange rates...');
  await prisma.exchangeRate.createMany({
    data: [
      { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
      { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79 },
      { fromCurrency: 'USD', toCurrency: 'JPY', rate: 149.50 },
      { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
      { fromCurrency: 'GBP', toCurrency: 'USD', rate: 1.27 },
      { fromCurrency: 'JPY', toCurrency: 'USD', rate: 0.0067 },
    ],
  });

  console.log('');
  console.log('✨ Database seeded successfully!');
  console.log('');
  console.log('📧 Demo Account Credentials:');
  console.log('   Email: demo@budgetwise.com');
  console.log('   Password: demo123');
  console.log('');
  console.log('📊 Seeded Data Summary:');
  console.log('   - 1 User');
  console.log('   - 12 Categories (4 Needs, 5 Wants, 3 Savings)');
  console.log('   - 13 Transactions (2 Income, 11 Expenses)');
  console.log('   - 3 Budget Goals (50/30/20)');
  console.log('   - 3 System Budgets (current month)');
  console.log('   - 1 Custom Budget with 3 allocations');
  console.log('   - 1 Mini Budget');
  console.log('   - 3 Category Rules');
  console.log('   - 6 Exchange Rates');
  console.log('   - 1 Cash Wallet ($500)');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
