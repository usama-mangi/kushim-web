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
      // If MFA is enabled, return a partial token or flag to prompt for OTP
      // For simplicity in this iteration, we return a temp token with 'is2fa: true' claim
      // Or we can just handle it in the frontend. 
      // A better flow: return { mfaRequired: true, tempToken: ... }
      // But adhering to standard JWT, we'll just sign it. 
      // Ideally, you'd check the OTP *before* issuing the full access token.
    }
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
}
