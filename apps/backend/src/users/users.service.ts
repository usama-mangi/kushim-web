import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import {
  CreateUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  InviteUserDto,
} from './dto/user.dto';
import { UserRole } from '@prisma/client';
import { AuditService, AuditAction } from '../audit/audit.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private auditService: AuditService,
  ) {}

  async findAll(customerId: string) {
    return this.prisma.user.findMany({
      where: { customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(userId: string, customerId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, customerId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        isActive: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        customerId: true,
        lastLoginAt: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            plan: true,
            status: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
        customerId: true,
      },
    });

    await this.auditService.log(
      AuditAction.USER_UPDATED,
      {
        userId,
        customerId: user.customerId || undefined,
      },
      { updatedFields: Object.keys(updateUserDto) },
    );

    return user;
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(changePasswordDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    await this.auditService.log(AuditAction.PASSWORD_CHANGED, {
      userId,
      customerId: user.customerId || undefined,
    });

    return { success: true, message: 'Password changed successfully' };
  }

  async inviteUser(
    inviteUserDto: InviteUserDto,
    inviterId: string,
    customerId: string,
  ) {
    const inviter = await this.prisma.user.findUnique({
      where: { id: inviterId },
      include: { customer: true },
    });

    if (!inviter || inviter.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can invite users');
    }

    const existingUser = await this.prisma.user.findFirst({
      where: { email: inviteUserDto.email, customerId },
    });

    if (existingUser) {
      throw new ConflictException('User already exists in this organization');
    }

    const existingInvitation = await this.prisma.userInvitation.findFirst({
      where: {
        email: inviteUserDto.email,
        customerId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      throw new ConflictException('Invitation already sent to this email');
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = await this.prisma.userInvitation.create({
      data: {
        email: inviteUserDto.email,
        role: inviteUserDto.role,
        token,
        customerId,
        invitedById: inviterId,
        expiresAt,
      },
    });

    await this.emailService.sendInvitationEmail(
      inviteUserDto.email,
      token,
      `${inviter.firstName} ${inviter.lastName}`,
      inviter.customer?.name || 'Organization',
    );

    await this.auditService.log(
      AuditAction.USER_CREATED,
      {
        userId: inviterId,
        customerId,
      },
      {
        invitedEmail: inviteUserDto.email,
        role: inviteUserDto.role,
        action: 'invitation_sent',
      },
    );

    return {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
    };
  }

  async deactivateUser(
    userId: string,
    customerId: string,
    requesterId: string,
  ) {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester || requester.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can deactivate users');
    }

    if (userId === requesterId) {
      throw new BadRequestException('You cannot deactivate yourself');
    }

    const user = await this.prisma.user.findFirst({
      where: { id: userId, customerId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    await this.auditService.log(
      AuditAction.USER_DELETED,
      {
        userId: requesterId,
        customerId,
      },
      { deactivatedUserId: userId, deactivatedUserEmail: user.email },
    );

    return { success: true, message: 'User deactivated successfully' };
  }

  async updateLoginStats(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date(),
        loginCount: { increment: 1 },
      },
    });
  }
}
