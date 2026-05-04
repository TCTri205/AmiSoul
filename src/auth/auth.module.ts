import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpModule } from '../otp/otp.module';
import { AccountLinkingModule } from '../account-linking/account-linking.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'amisoul_super_secret_key_2026',
      signOptions: { expiresIn: '7d' },
    }),
    OtpModule,
    forwardRef(() => AccountLinkingModule),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
