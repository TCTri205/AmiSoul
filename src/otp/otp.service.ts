import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'localhost',
      port: parseInt(this.configService.get<string>('SMTP_PORT') || '1025', 10),
      secure: false,
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string): Promise<boolean> {
    // Cleanup old OTPs for this email and globally expired ones
    await this.prisma.otpVerification.deleteMany({
      where: {
        OR: [
          { email },
          { expiresAt: { lt: new Date() } },
        ],
      },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpVerification.create({
      data: {
        email,
        codeHash,
        expiresAt,
      },
    });

    try {
      if (this.configService.get('NODE_ENV') === 'production') {
        await this.transporter.sendMail({
          from: this.configService.get('SMTP_FROM') || '"AmiSoul" <no-reply@amisoul.ai>',
          to: email,
          subject: 'AmiSoul Verification Code',
          text: `Your verification code is: ${code}. It expires in 10 minutes.`,
        });
      } else {
        this.logger.log(`[MOCK EMAIL] To: ${email}, Code: ${code}`);
      }
      return true;
    } catch (error) {
      this.logger.error(`Failed to send OTP to ${email}: ${error.message}`);
      return false;
    }
  }

  async verifyOtp(email: string, code: string): Promise<boolean> {
    const verification = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!verification) return false;

    if (verification.attempts >= 3) {
      this.logger.warn(`Too many attempts for ${email}`);
      return false;
    }

    const isValid = await bcrypt.compare(code, verification.codeHash);

    if (!isValid) {
      await this.prisma.otpVerification.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } },
      });
      return false;
    }

    // Clean up used OTP
    await this.prisma.otpVerification.delete({ where: { id: verification.id } });

    return true;
  }
}
