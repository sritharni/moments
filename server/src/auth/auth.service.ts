import { createHash, randomBytes } from 'crypto';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { EmailVerificationService } from './email-verification.service';

const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email is already in use');
    }

    const existingUsername = await this.usersService.findByUsername(
      registerDto.username,
    );

    if (existingUsername) {
      throw new ConflictException('Username is already in use');
    }

    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    let user;

    try {
      user = await this.usersService.create({
        username: registerDto.username,
        email: registerDto.email,
        password: passwordHash,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = Array.isArray(error.meta?.target) ? error.meta.target : [];

        if (target.includes('username')) {
          throw new ConflictException('Username is already in use');
        }

        if (target.includes('email')) {
          throw new ConflictException('Email is already in use');
        }
      }

      throw error;
    }

    await this.emailVerificationService.issueCode(user.id, user.email);

    return {
      requiresVerification: true,
      email: user.email,
      message: 'Account created. Check your email for a 6-digit verification code.',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordMatches = await bcrypt.compare(loginDto.password, user.password);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerified) {
      throw new ForbiddenException({
        message: 'Email not verified. Please verify your email to continue.',
        requiresVerification: true,
        email: user.email,
      });
    }

    return this.buildAuthResponse(user.id, user.email, user.username);
  }

  async verifyEmail(email: string, code: string) {
    const result = await this.emailVerificationService.verifyCode(email, code);

    const user = await this.usersService.findById(result.userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.buildAuthResponse(user.id, user.email, user.username);
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { success: true };
    }

    if (user.emailVerified) {
      return { success: true, alreadyVerified: true };
    }

    await this.emailVerificationService.issueCode(user.id, user.email);
    return { success: true };
  }

  async refreshAccessToken(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date()) {
      if (stored) {
        await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      }
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.buildAuthResponse(stored.user.id, stored.user.email, stored.user.username);
  }

  async logout(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    await this.prisma.refreshToken.deleteMany({ where: { tokenHash } });
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  private async buildAuthResponse(userId: string, email: string, username: string) {
    const payload = { sub: userId, email, username };
    const accessToken = await this.jwtService.signAsync(payload);

    const rawRefreshToken = randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await this.prisma.refreshToken.create({
      data: { userId, tokenHash, expiresAt },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
      user: { id: userId, email, username },
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
