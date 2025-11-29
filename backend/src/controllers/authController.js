import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../middleware/errorHandler.js';
import { generateToken } from '../middleware/auth.js';

const prisma = new PrismaClient();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { email, password, name } = req.body;

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new ApiError(409, 'User already exists with this email');
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
  });

  // Create default user settings
  await prisma.userSettings.create({
    data: {
      userId: user.id,
    },
  });

  // Create default budget goals (50/30/20 rule)
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

  // Create default cash wallet
  await prisma.cashWallet.create({
    data: {
      userId: user.id,
      amount: 0,
    },
  });

  // Generate token
  const token = generateToken(user.id, user.email);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      password: true,
    },
  });

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate token
  const token = generateToken(user.id, user.email);

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token,
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  // In JWT-based auth, logout is typically handled client-side by removing the token
  // This endpoint is provided for consistency and can be used for logging purposes

  res.json({
    success: true,
    message: 'Logout successful',
  });
});
