import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<number>('EMAIL_PORT') === 465,
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string, firstName: string) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const verificationLink = `${frontendUrl}/auth/verify-email?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject: 'Verify Your Email - Kushim',
        html: this.getVerificationEmailTemplate(firstName, verificationLink),
      });
      this.logger.log(`Verification email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(
    email: string,
    token: string,
    firstName: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const resetLink = `${frontendUrl}/auth/reset-password?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject: 'Reset Your Password - Kushim',
        html: this.getPasswordResetTemplate(firstName, resetLink),
      });
      this.logger.log(`Password reset email sent to ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}`,
        error,
      );
      throw error;
    }
  }

  async sendInvitationEmail(
    email: string,
    token: string,
    inviterName: string,
    orgName: string,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');
    const invitationLink = `${frontendUrl}/auth/accept-invitation?token=${token}`;

    try {
      await this.transporter.sendMail({
        from: this.configService.get<string>('EMAIL_FROM'),
        to: email,
        subject: `You're invited to join ${orgName} on Kushim`,
        html: this.getInvitationTemplate(inviterName, orgName, invitationLink),
      });
      this.logger.log(`Invitation email sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send invitation email to ${email}`, error);
      throw error;
    }
  }

  private getVerificationEmailTemplate(
    firstName: string,
    verificationLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Welcome to Kushim, ${firstName}!</h1>
            <p>Thank you for signing up. Please verify your email address to get started.</p>
            <a href="${verificationLink}" class="button">Verify Email Address</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${verificationLink}</p>
            <p>This link will expire in 24 hours.</p>
            <div class="footer">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Kushim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getPasswordResetTemplate(
    firstName: string,
    resetLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Reset Your Password</h1>
            <p>Hi ${firstName},</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${resetLink}" class="button">Reset Password</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${resetLink}</p>
            <p>This link will expire in 1 hour.</p>
            <div class="footer">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Kushim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  private getInvitationTemplate(
    inviterName: string,
    orgName: string,
    invitationLink: string,
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .button { 
              display: inline-block; 
              padding: 12px 24px; 
              background-color: #4F46E5; 
              color: #ffffff; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 40px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>You're Invited!</h1>
            <p>${inviterName} has invited you to join <strong>${orgName}</strong> on Kushim.</p>
            <p>Kushim helps organizations automate their compliance processes and maintain SOC 2 readiness.</p>
            <a href="${invitationLink}" class="button">Accept Invitation</a>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #4F46E5;">${invitationLink}</p>
            <p>This invitation will expire in 7 days.</p>
            <div class="footer">
              <p>If you don't want to accept this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} Kushim. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }
}
