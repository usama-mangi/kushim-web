import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import {
  LoginDto,
  RegisterDto,
  VerifyEmailDto,
  ResendVerificationDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  AcceptInvitationDto,
} from './dto/auth.dto';
import {
  LoginResponseDto,
  RegisterResponseDto,
  VerifyEmailResponseDto,
  ForgotPasswordResponseDto,
  ResetPasswordResponseDto,
  UserResponseDto,
  ErrorResponseDto,
} from './dto/auth-response.dto';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticate user and receive JWT access token',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid credentials',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async login(@Body() body: LoginDto) {
    return this.authService.login(body);
  }

  @Post('register')
  @ApiOperation({
    summary: 'Register a new account',
    description: 'Create a new user account and send verification email',
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Registration successful',
    type: RegisterResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation error',
    type: ErrorResponseDto,
  })
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Post('verify-email')
  @ApiOperation({
    summary: 'Verify email with token',
    description:
      'Verify user email address using token from verification email',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email verified successfully',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async verifyEmail(@Body() body: VerifyEmailDto) {
    return this.authService.verifyEmail(body.token);
  }

  @Post('resend-verification')
  @ApiOperation({
    summary: 'Resend verification email',
    description: 'Send a new verification email to the user',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification email sent',
    type: VerifyEmailResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async resendVerification(@Body() body: ResendVerificationDto) {
    return this.authService.resendVerification(body.email);
  }

  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send password reset email with reset token',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset email sent',
    type: ForgotPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
    type: ErrorResponseDto,
  })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password with token',
    description: 'Reset user password using token from reset email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset successful',
    type: ResetPasswordResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired token',
    type: ErrorResponseDto,
  })
  async resetPassword(@Body() body: ResetPasswordDto) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('accept-invitation')
  @ApiOperation({
    summary: 'Accept user invitation',
    description: 'Complete account setup using invitation token',
  })
  @ApiBody({ type: AcceptInvitationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Invitation accepted successfully',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired invitation token',
    type: ErrorResponseDto,
  })
  async acceptInvitation(@Body() body: AcceptInvitationDto) {
    return this.authService.acceptInvitation(
      body.token,
      body.password,
      body.firstName,
      body.lastName,
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('JWT-auth')
  @Get('me')
  @ApiOperation({
    summary: 'Get current user',
    description: 'Get authenticated user profile information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile retrieved',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  async getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }
}
