import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { UsersService } from './users.service';
import {
  UpdateUserDto,
  ChangePasswordDto,
  InviteUserDto,
} from './dto/user.dto';
import {
  UserProfileResponseDto,
  InviteUserResponseDto,
  ChangePasswordResponseDto,
  UserListResponseDto,
} from './dto/user-response.dto';
import { ErrorResponseDto } from '../auth/dto/auth-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  @ApiOperation({
    summary: 'Get current user profile',
    description: 'Get authenticated user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getProfile(@Request() req) {
    return this.usersService.getProfile(req.user.sub);
  }

  @Patch('profile')
  @ApiOperation({
    summary: 'Update current user profile',
    description: 'Update first name and/or last name of authenticated user',
  })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profile updated successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(req.user.sub, updateUserDto);
  }

  @Post('change-password')
  @ApiOperation({
    summary: 'Change current user password',
    description: 'Change password for authenticated user',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully',
    type: ChangePasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Current password is incorrect',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(req.user.sub, changePasswordDto);
  }

  @Post('invite')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Invite a new user (admin only)',
    description: 'Send invitation email to a new user (requires admin role)',
  })
  @ApiBody({ type: InviteUserDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User invitation sent successfully',
    type: InviteUserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin role',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'User with this email already exists',
    type: ErrorResponseDto,
  })
  async inviteUser(@Request() req, @Body() inviteUserDto: InviteUserDto) {
    return this.usersService.inviteUser(
      inviteUserDto,
      req.user.sub,
      req.user.customerId,
    );
  }

  @Get()
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'List all users in organization (admin only)',
    description:
      'Get list of all users in the organization (requires admin role)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Users retrieved successfully',
    type: UserListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin role',
    type: ErrorResponseDto,
  })
  async findAll(@Request() req) {
    return this.usersService.findAll(req.user.customerId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get user by ID (admin only)',
    description:
      'Get detailed information about a specific user (requires admin role)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User retrieved successfully',
    type: UserProfileResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin role',
    type: ErrorResponseDto,
  })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.usersService.findById(id, req.user.customerId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Deactivate user (admin only)',
    description: 'Deactivate a user account (requires admin role)',
  })
  @ApiParam({
    name: 'id',
    description: 'User ID to deactivate',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'User does not have admin role',
    type: ErrorResponseDto,
  })
  async deactivate(@Request() req, @Param('id') id: string) {
    return this.usersService.deactivateUser(
      id,
      req.user.customerId,
      req.user.sub,
    );
  }
}
