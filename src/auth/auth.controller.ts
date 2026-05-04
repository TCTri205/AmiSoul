import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { AccountLinkingService } from '../account-linking/account-linking.service';
import { SendOtpDto } from '../otp/dto/send-otp.dto';
import { VerifyOtpDto } from '../otp/dto/verify-otp.dto';
import { LinkAccountDto } from '../account-linking/dto/link-account.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly otpService: OtpService,
    private readonly accountLinkingService: AccountLinkingService,
  ) {}

  @Post('send-otp')
  async sendOtp(@Body() sendOtpDto: SendOtpDto) {
    const success = await this.otpService.sendOtp(sendOtpDto.email);
    if (!success) {
      throw new BadRequestException('Failed to send OTP');
    }
    return { message: 'OTP sent successfully' };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(verifyOtpDto.email, verifyOtpDto.code);
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    return { message: 'OTP verified successfully' };
  }

  @Post('link-account')
  async linkAccount(@Body() linkAccountDto: LinkAccountDto) {
    return this.accountLinkingService.linkGuestToAccount(
      linkAccountDto.deviceId,
      linkAccountDto.email,
      linkAccountDto.code,
    );
  }
}
