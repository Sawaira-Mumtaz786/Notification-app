import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, IUserDocument } from '../../database/db.ts';
import { RegisterDto } from './dto/register.dto.ts';
import { LoginDto } from './dto/login.dto.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-notifications-system-2026';
const JWT_EXPIRES_IN = '7d';

export interface UserResponse {
  id: string;
  fullName: string;
  username: string;
  createdAt: string;
}

export interface AuthResponse {
  user: UserResponse;
  token: string;
}

export class AuthService {
  /**
   * Register a new user with bcrypt password hashing
   * Enforces uniqueness of username and minimum password length
   */
  async register(dto: RegisterDto): Promise<AuthResponse> {
    const existing = await UserModel.findOne({ username: dto.username });
    if (existing) {
      const error: any = new Error(`Username '${dto.username}' is already taken`);
      error.statusCode = 409;
      throw error;
    }

    // Hash password with bcrypt (fixing legacy MD5 vulnerability)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await UserModel.create({
      fullName: dto.fullName,
      username: dto.username,
      passwordHash,
    });

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Authenticate a user with credentials and issue JWT
   */
  async login(dto: LoginDto): Promise<AuthResponse> {
    const user = await UserModel.findOne({ username: dto.username });
    if (!user) {
      const error: any = new Error('Invalid username or password');
      error.statusCode = 401;
      throw error;
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      const error: any = new Error('Invalid username or password');
      error.statusCode = 401;
      throw error;
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  /**
   * Verify and decode a JWT token
   */
  verifyToken(token: string): { userId: string; username: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
      return decoded;
    } catch {
      const error: any = new Error('Invalid or expired authentication token');
      error.statusCode = 401;
      throw error;
    }
  }

  /**
   * Get authenticated user profile without exposing password hash
   */
  async getProfile(userId: string): Promise<UserResponse> {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }
    return this.sanitizeUser(user);
  }

  private generateToken(user: IUserDocument): string {
    return jwt.sign(
      {
        userId: user.id,
        username: user.username,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  private sanitizeUser(user: IUserDocument): UserResponse {
    return {
      id: user.id,
      fullName: user.fullName,
      username: user.username,
      createdAt: user.createdAt,
    };
  }
}

export const authService = new AuthService();
