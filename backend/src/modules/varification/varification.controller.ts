import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { VarificationService } from './varification.service';

@ApiTags('Varification')
@ApiBearerAuth()
@Controller('pan')
export class VarificationController {
  constructor(private readonly service: VarificationService) {}

  // POST /pan/verify
  @Post('verify')
  @Permissions(PERMISSIONS.CUSTOMER_PROFILE_MANAGE)
  async verifyPan(
    @Body() body: { panNumber: string; name?: string; applicationId: number },
  ) {
    return this.service.verifyPan(
      body?.panNumber,
      body?.name,
      body?.applicationId,
    );
  }
}
