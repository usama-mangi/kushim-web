import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { authenticator } from 'otplib';
import * as qrcode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await argon2.verify(user.passwordHash, pass))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    if (user.mfaEnabled) {
      // Return a temporary token that is only valid for MFA verification
      const payload = { sub: user.id, isMfaTemp: true };
      return {
        mfaRequired: true,
        temp_token: this.jwtService.sign(payload, { expiresIn: '5m' }), // Short lived
      };
    }

    // Standard login for non-MFA users
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        mfaEnabled: user.mfaEnabled,
      },
    };
  }

  async verifyMfaLogin(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      throw new UnauthorizedException('MFA not enabled for this user');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid OTP code');
    }

    // Issue full access token
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        mfaEnabled: true,
      },
    };
  }

  async getMfaStatus(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    return { enabled: !!user?.mfaEnabled };
  }

  async generateMfaSecret(userId: string) {
    const secret = authenticator.generateSecret();
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otpauthUrl = authenticator.keyuri(user.email, 'Kushim', secret);

    await this.prisma.user.update({
      where: { id: userId },
      data: { mfaSecret: secret },
    });

    const qrCodeUrl = await qrcode.toDataURL(otpauthUrl);
    return { secret, qrCodeUrl };
  }

  async verifyMfaToken(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.mfaSecret) {
      throw new UnauthorizedException('MFA not setup for this user');
    }

    const isValid = authenticator.verify({
      token,
      secret: user.mfaSecret,
    });

    if (isValid) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { mfaEnabled: true },
      });
      return { success: true };
    } else {
      throw new UnauthorizedException('Invalid OTP token');
    }
  }

  async validateOrCreateSocialUser(email: string, provider: string) {
    let user = await this.usersService.findOne(email);

    if (!user) {
      // Create new user with random password
      const randomPassword = Math.random().toString(36).slice(-8);
      // Default to USER role
      user = await this.usersService.create(email, randomPassword, 'USER');
    }

    return user;
  }

  async register(email: string, pass: string) {
    const existing = await this.usersService.findOne(email);
    if (existing) {
      throw new Error('User already exists');
    }

    const user = await this.usersService.create(email, pass);
    return this.login(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOne(email);
    if (!user) {
      // Don't leak user existence
      return { message: 'If an account exists, a reset link has been sent' };
    }

    // In a real app, generate a reset token and send email.
    // For now, we'll log it.
    console.log(`Password reset requested for ${email}`);
    return { message: 'If an account exists, a reset link has been sent' };
  }
}
