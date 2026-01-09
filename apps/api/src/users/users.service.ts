import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
  }

  async create(email: string, password: string, roleName: string = 'USER') {
    const passwordHash = await argon2.hash(password);
    const role = await this.prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      throw new Error(`Role ${roleName} not found`);
    }

    return this.prisma.user.create({
      data: {
        email,
        passwordHash,
        roleId: role.id,
      },
      include: { role: true },
    });
  }
}