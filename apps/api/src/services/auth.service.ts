import { prisma } from "@buievo/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { User } from "@buievo/types";

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
}

export interface UserWithoutPassword {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  createdAt: Date;
  updatedAt: Date;
  refreshToken?: string | null;
}

export class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
  private readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly REFRESH_TOKEN_EXPIRY = '7d';

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        password: hashedPassword,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as UserWithoutPassword,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ user: UserWithoutPassword; tokens: AuthTokens }> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: credentials.email },
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id);

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword as UserWithoutPassword,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.JWT_REFRESH_SECRET) as { userId: string };
      
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id);

      return tokens;
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<{ userId: string; user: UserWithoutPassword }> {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      return {
        userId: decoded.userId,
        user: userWithoutPassword as UserWithoutPassword,
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return null;
    }

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithoutPassword;
  }

  /**
   * Update user profile
   */
  async updateUserProfile(
    userId: string,
    data: { name?: string; email?: string }
  ): Promise<UserWithoutPassword> {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    // Return user without password
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword as UserWithoutPassword;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return true;
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<boolean> {
    try {
      // Clear refresh token
      await prisma.user.update({
        where: { id: userId },
        data: {
          refreshToken: null,
        },
      });

      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists or not
      return true;
    }

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password-reset' },
      this.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // In a real application, you would send this token via email
    // For now, we'll just store it temporarily
    console.log(`Password reset token for ${email}: ${resetToken}`);

    return true;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'password-reset') {
        throw new Error('Invalid token type');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          password: hashedPassword,
        },
      });

      return true;
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string): Promise<boolean> {
    try {
      // Verify token
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: string; type: string };
      
      if (decoded.type !== 'email-verification') {
        throw new Error('Invalid token type');
      }

      // Update user
      await prisma.user.update({
        where: { id: decoded.userId },
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
        },
      });

      return true;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }

  /**
   * Request email verification
   */
  async requestEmailVerification(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.isEmailVerified) {
      throw new Error('Email is already verified');
    }

    // Generate verification token
    const verificationToken = jwt.sign(
      { userId: user.id, type: 'email-verification' },
      this.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update user with verification token
    await prisma.user.update({
      where: { id: userId },
      data: {
        emailVerificationToken: verificationToken,
      },
    });

    // In a real application, you would send this token via email
    // For now, we'll just log it
    console.log(`Email verification token for ${user.email}: ${verificationToken}`);

    return true;
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string): Promise<AuthTokens> {
    const accessToken = jwt.sign(
      { userId },
      this.JWT_SECRET,
      { expiresIn: this.ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { userId },
      this.JWT_REFRESH_SECRET,
      { expiresIn: this.REFRESH_TOKEN_EXPIRY }
    );

    // Store refresh token in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshToken,
      },
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}

export const authService = new AuthService();
