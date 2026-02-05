import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService, AuditAction } from '../audit/audit.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async login(user: any) {
    const foundUser = await this.prisma.user.findUnique({
      where: { email: user.email },
    });

    if (!foundUser) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!foundUser.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      user.password,
      foundUser.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: foundUser.id },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });

    const payload = {
      sub: foundUser.id,
      email: foundUser.email,
      role: foundUser.role,
      customerId: foundUser.customerId || undefined,
    };

    await this.auditService.log(AuditAction.USER_LOGIN, {
      userId: foundUser.id,
      customerId: foundUser.customerId || undefined,
    });

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: foundUser.id,
        email: foundUser.email,
        firstName: foundUser.firstName,
        lastName: foundUser.lastName,
        role: foundUser.role,
        customerId: foundUser.customerId || undefined,
        emailVerified: foundUser.emailVerified,
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
    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

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
        role: UserRole.ADMIN,
        customerId: customer.id,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    await this.emailService.sendVerificationEmail(
      newUser.email,
      emailVerificationToken,
      newUser.firstName,
    );

    await this.auditService.log(AuditAction.USER_CREATED, {
      userId: newUser.id,
      customerId: customer.id,
    });

    return {
      success: true,
      message:
        'Registration successful. Please check your email to verify your account.',
      userId: newUser.id,
    };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findUnique({
      where: { emailVerificationToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid verification token');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    if (
      user.emailVerificationExpires &&
      user.emailVerificationExpires < new Date()
    ) {
      throw new BadRequestException('Verification token has expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });

    await this.auditService.log(
      AuditAction.USER_UPDATED,
      {
        userId: user.id,
        customerId: user.customerId || undefined,
      },
      { emailVerified: true },
    );

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      customerId: user.customerId || undefined,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        customerId: user.customerId || undefined,
        emailVerified: true,
      },
    };
  }

  async resendVerification(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If an account exists with that email, a verification link has been sent.',
      };
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email already verified');
    }

    const emailVerificationToken = uuidv4();
    const emailVerificationExpires = new Date();
    emailVerificationExpires.setHours(emailVerificationExpires.getHours() + 24);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    await this.emailService.sendVerificationEmail(
      user.email,
      emailVerificationToken,
      user.firstName,
    );

    return {
      success: true,
      message: 'Verification email sent successfully.',
    };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
        message:
          'If an account exists with that email, a reset link has been sent.',
      };
    }

    const resetPasswordToken = uuidv4();
    const resetPasswordExpires = new Date();
    resetPasswordExpires.setHours(resetPasswordExpires.getHours() + 1);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken,
        resetPasswordExpires,
      },
    });

    await this.emailService.sendPasswordResetEmail(
      user.email,
      resetPasswordToken,
      user.firstName,
    );

    await this.auditService.log(
      AuditAction.PASSWORD_RESET,
      {
        userId: user.id,
        customerId: user.customerId || undefined,
      },
      { action: 'requested' },
    );

    return {
      success: true,
      message:
        'If an account exists with that email, a reset link has been sent.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { resetPasswordToken: token },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (user.resetPasswordExpires && user.resetPasswordExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    await this.auditService.log(
      AuditAction.PASSWORD_RESET,
      {
        userId: user.id,
        customerId: user.customerId || undefined,
      },
      { action: 'completed' },
    );

    return {
      success: true,
      message:
        'Password reset successfully. You can now login with your new password.',
    };
  }

  async acceptInvitation(
    token: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const invitation = await this.prisma.userInvitation.findUnique({
      where: { token },
      include: { invitedBy: true },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== 'PENDING') {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (invitation.expiresAt < new Date()) {
      await this.prisma.userInvitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });
      throw new BadRequestException('Invitation has expired');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        email: invitation.email,
        password: hashedPassword,
        firstName,
        lastName,
        role: invitation.role,
        customerId: invitation.customerId,
        emailVerified: true,
      },
    });

    await this.prisma.userInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
        invitedUserId: newUser.id,
      },
    });

    await this.auditService.log(
      AuditAction.USER_CREATED,
      {
        userId: newUser.id,
        customerId: newUser.customerId || undefined,
      },
      { invitedBy: invitation.invitedById, viaInvitation: true },
    );

    const payload = {
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
      customerId: newUser.customerId || undefined,
    };

    return {
      token: this.jwtService.sign(payload),
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        customerId: newUser.customerId || undefined,
        emailVerified: true,
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
      customerId: user.customerId || undefined,
      emailVerified: user.emailVerified,
    };
  }
}
