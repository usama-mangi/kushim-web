import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

describe('EmailService', () => {
  let service: EmailService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config = {
        EMAIL_HOST: 'smtp.test.com',
        EMAIL_PORT: 587,
        EMAIL_USER: 'test@test.com',
        EMAIL_PASSWORD: 'password',
        EMAIL_FROM: 'Test <noreply@test.com>',
        FRONTEND_URL: 'http://localhost:3000',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendVerificationEmail', () => {
    it('should send verification email with correct parameters', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue(null);

      await service.sendVerificationEmail(
        'user@example.com',
        'token-123',
        'John',
      );

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Verify Your Email - Kushim',
          html: expect.stringContaining('token-123'),
        }),
      );
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with correct parameters', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue(null);

      await service.sendPasswordResetEmail(
        'user@example.com',
        'reset-token',
        'John',
      );

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: 'Reset Your Password - Kushim',
          html: expect.stringContaining('reset-token'),
        }),
      );
    });
  });

  describe('sendInvitationEmail', () => {
    it('should send invitation email with correct parameters', async () => {
      const sendMailSpy = jest
        .spyOn(service['transporter'], 'sendMail')
        .mockResolvedValue(null);

      await service.sendInvitationEmail(
        'newuser@example.com',
        'invite-token',
        'Admin User',
        'Test Org',
      );

      expect(sendMailSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'newuser@example.com',
          subject: expect.stringContaining('Test Org'),
          html: expect.stringContaining('invite-token'),
        }),
      );
    });
  });
});
