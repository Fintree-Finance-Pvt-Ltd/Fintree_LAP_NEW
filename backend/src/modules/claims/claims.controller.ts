import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, resolve } from 'path';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleCode } from '../../common/enums/role.enum';
import { ClaimsService } from './claims.service';
import {
  ApproveClaimDto,
  BulkApproveClaimsDto,
  BulkRejectClaimsDto,
  CreateClaimDto,
  QueryClaimsDto,
  RejectClaimDto,
  UpdatePaymentStatusDto,
} from './dto/claims.dto';

const claimReceiptUploadDirectory = resolve(
  process.cwd(),
  'uploads',
  'claims',
);

if (!existsSync(claimReceiptUploadDirectory)) {
  mkdirSync(claimReceiptUploadDirectory, { recursive: true });
}

@ApiTags('Claims')
@ApiBearerAuth()
@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  /**
   * Upload receipt / bill file
   */
  @Post('upload-receipt')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: claimReceiptUploadDirectory,
        filename: (_req, file, cb) => {
          const extension = extname(file.originalname).toLowerCase();
          const cleanName = file.originalname
            .replace(extension, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .slice(0, 30);
          const fileName = `receipt-${Date.now()}-${cleanName}${extension}`;
          cb(null, fileName);
        },
      }),
      limits: {
        fileSize: 20 * 1024 * 1024, // 20 MB
      },
      fileFilter: (_req, file, cb) => {
        const allowedMimes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/jpg',
          'application/pdf',
        ];
        if (!allowedMimes.includes(file.mimetype.toLowerCase())) {
          return cb(
            new BadRequestException(
              'Only JPG, PNG, WEBP and PDF files are allowed for bill receipts.',
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  uploadReceipt(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }
    const receiptUrl = `/uploads/claims/${file.filename}`;
    return {
      success: true,
      data: {
        url: receiptUrl,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      },
      message: 'Receipt uploaded successfully.',
    };
  }

  /**
   * Apply / Submit a new claim (Any authenticated user)
   */
  @Post('apply')
  async applyClaim(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: CreateClaimDto,
  ) {
    return this.claimsService.createClaim(user.id, dto);
  }

  /**
   * Get logged-in user's claims
   */
  @Get('my-claims')
  async getMyClaims(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query() query: QueryClaimsDto,
  ) {
    return this.claimsService.getMyClaims(user.id, query);
  }

  /**
   * Cancel pending claim (User only)
   */
  @Post(':id/cancel')
  async cancelClaim(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.claimsService.cancelClaim(id, user.id);
  }

  /**
   * Get claim stats
   */
  @Get('stats')
  async getClaimStats(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Query('userId') queryUserId?: string,
    @Query('scope') scope?: string,
    @Query('month') month?: string,
  ) {
    const isAdmin =
      user.roles?.includes(RoleCode.ADMIN) ||
      (user.email && user.email.toLowerCase().includes('admin'));

    let targetUserId: number | undefined = user.id;
    if (isAdmin) {
      if (scope === 'all' || queryUserId === 'all') {
        targetUserId = undefined;
      } else if (queryUserId && !isNaN(parseInt(queryUserId, 10))) {
        targetUserId = parseInt(queryUserId, 10);
      }
    }
    return this.claimsService.getClaimStats(targetUserId, month);
  }

  /**
   * Admin: View all claims across organization
   */
  @Get('admin/all')
  @Roles(RoleCode.ADMIN)
  async getAllClaims(@Query() query: QueryClaimsDto) {
    return this.claimsService.getAllClaims(query);
  }

  /**
   * Admin: Approve claim
   */
  @Post('admin/:id/approve')
  @Roles(RoleCode.ADMIN)
  async approveClaim(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ApproveClaimDto,
  ) {
    return this.claimsService.approveClaim(id, user.id, dto);
  }

  /**
   * Admin: Bulk approve claims
   */
  @Post('admin/bulk-approve')
  @Roles(RoleCode.ADMIN)
  async bulkApproveClaims(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: BulkApproveClaimsDto,
  ) {
    return this.claimsService.bulkApproveClaims(user.id, dto);
  }

  /**
   * Admin: Reject claim
   */
  @Post('admin/:id/reject')
  @Roles(RoleCode.ADMIN)
  async rejectClaim(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RejectClaimDto,
  ) {
    return this.claimsService.rejectClaim(id, user.id, dto);
  }

  /**
   * Admin: Bulk reject claims
   */
  @Post('admin/bulk-reject')
  @Roles(RoleCode.ADMIN)
  async bulkRejectClaims(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Body() dto: BulkRejectClaimsDto,
  ) {
    return this.claimsService.bulkRejectClaims(user.id, dto);
  }

  /**
   * Admin: Update payment disbursement status
   */
  @Post('admin/:id/payment-status')
  @Roles(RoleCode.ADMIN)
  async updatePaymentStatus(
    @CurrentUser() user: { id: number; email: string; roles: string[] },
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.claimsService.updatePaymentStatus(id, user.id, dto);
  }

  /**
   * Get claim details by ID
   */
  @Get(':id')
  async getClaimById(@Param('id', ParseIntPipe) id: number) {
    return this.claimsService.getClaimById(id);
  }
}
