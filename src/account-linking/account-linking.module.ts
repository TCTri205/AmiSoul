import { forwardRef, Module } from '@nestjs/common';
import { AccountLinkingService } from './account-linking.service';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OtpModule, forwardRef(() => AuthModule)],
  providers: [AccountLinkingService],
  exports: [AccountLinkingService],
})
export class AccountLinkingModule {}
