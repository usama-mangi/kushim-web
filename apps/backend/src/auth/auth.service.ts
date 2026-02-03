import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../shared/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!foundUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(user.password, foundUser.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { 
      sub: foundUser.id, 
      email: foundUser.email, 
      role: foundUser.role,
      customerId: foundUser.customerId 
    };
    
    return {
      token: this.jwtService.sign(payload),
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: foundUser.role,
        customerId: foundUser.customerId,
      },
    };
  }

  async register(user: any) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(user.password, 10);

    // Create a new Customer for this user (Multi-tenancy)
    const customer = await this.prisma.customer.create({
      data: {
        name: `${user.firstName || 'New'} ${user.lastName || 'User'}'s Org`,
        email: user.email,
      },
    });

    const newUser = await this.prisma.user.create({
      data: {
        email: user.email,
        password: hashedPassword,
        firstName: user.firstName,
        lastName: user.lastName,
        role: 'user',
        customerId: customer.id,
      },
    });

    const payload = { 
      sub: newUser.id, 
      email: newUser.email, 
      role: newUser.role,
      customerId: newUser.customerId 
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        customerId: newUser.customerId,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      customerId: user.customerId,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if user exists, but we'll log it
      console.log(`Password reset requested for non-existent email: ${email}`);
    } else {
      console.log(`Password reset requested for user: ${email}. In production, we would send an email here.`);
    }

    return { success: true, message: 'If an account exists with that email, a reset link has been sent.' };
  }
}
