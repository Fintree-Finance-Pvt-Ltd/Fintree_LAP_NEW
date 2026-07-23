import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { OpsService } from './ops.service';
import { Request } from 'express';
// import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';

interface AuthenticatedRequest extends Request {
  user?: {
    id?: string | number;
    userId?: string | number;
    sub?: string | number;
    roles?: string[];
    permissions?: string[];
  };
}
@Controller('operations')
export class OpsController {
  constructor(
    private readonly operationsService: OpsService,
  ) {}

   @Get('maker/:applicationId')
  async getOpsMakerCase(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.operationsService.getOpsMakerCase(applicationId);

    return {
      success: true,
      message: 'Operations maker case fetched successfully',
      data,
    };
  }

   @Get('head/:applicationId')
  async getOpsHeadCase(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.operationsService.getOpsHeadCase(applicationId);

    return {
      success: true,
      message: 'Operations head case fetched successfully',
      data,
    };
  }

  @Get('checker/:applicationId')
  async getCheckerCase(
    @Param('applicationId', ParseIntPipe)
    applicationId: number,
  ) {
    const data =
      await this.operationsService.getCheckerCase(applicationId);

    return {
      success: true,
      message: 'Operations checker case fetched successfully',
      data,
    };
  }


  // GET /api/bm-reviews/queue
  @Get("queue")
  async getSubmittedToBmCases(
    @Req() request : Request,
  ) {

    const user = request.user as any;
    const applications =
      await this.operationsService.getSubmittedToOpsCheckerCases(user,);

    return {
      success: true,
      applications,
    };
  }


    @Patch('maker/:applicationId/approve')
async approveByOpsMaker(
  @Param('applicationId', ParseIntPipe)
  applicationId: number,

  @Req()
  request: AuthenticatedRequest,
) {
  const rawUserId =
    request.user?.id ??
    request.user?.userId ??
    request.user?.sub;

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedException(
      'Authenticated user ID is missing or invalid.',
    );
  }

  return this.operationsService.approveByOpsMaker(
    applicationId,
    request.user || { id: userId, roles: ['OPS_MAKER'] },
  );
}

 @Patch('head/:applicationId/approve')
async approveByOpsHead(
  @Param('applicationId', ParseIntPipe)
  applicationId: number,

  @Req()
  request: AuthenticatedRequest,
) {
  const rawUserId =
    request.user?.id ??
    request.user?.userId ??
    request.user?.sub;

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedException(
      'Authenticated user ID is missing or invalid.',
    );
  }

  return this.operationsService.approveByOpsHead(
    applicationId,
    request.user || { id: userId, roles: ['OPS_HEAD'] },
  );
}

 @Patch('checker/:applicationId/approve')
async approveByOpsChecker(
  @Param('applicationId', ParseIntPipe)
  applicationId: number,

  @Req()
  request: AuthenticatedRequest,
) {
  const rawUserId =
    request.user?.id ??
    request.user?.userId ??
    request.user?.sub;

  const userId = Number(rawUserId);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedException(
      'Authenticated user ID is missing or invalid.',
    );
  }

  return this.operationsService.approveByOpsChecker(
    applicationId,
    request.user || { id: userId, roles: ['OPS_CHECKER'] },
  );
}
}
