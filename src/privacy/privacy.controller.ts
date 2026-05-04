import { Controller, Get, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { PrivacyService } from './privacy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('privacy')
@UseGuards(JwtAuthGuard)
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Delete('memories/soft')
  async softDelete(@Request() req: any) {
    await this.privacyService.softDeleteUserData(req.user.id);
    return { message: 'Data hidden successfully' };
  }

  @Delete('memories/hard')
  async hardDelete(@Request() req: any) {
    await this.privacyService.hardDeleteUserData(req.user.id);
    return { message: 'Data deleted permanently' };
  }

  @Get('export')
  async exportData(@Request() req: any) {
    return this.privacyService.exportUserData(req.user.id);
  }

  @Delete('memories/:id')
  async deleteOneMemory(@Request() req: any, @Param('id') id: string) {
    await this.privacyService.deleteMemory(req.user.id, id);
    return { message: 'Memory deleted successfully' };
  }
}
