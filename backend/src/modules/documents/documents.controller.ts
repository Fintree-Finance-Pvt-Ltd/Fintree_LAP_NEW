
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiTags,
} from '@nestjs/swagger';
import {
  existsSync,
  mkdirSync,
} from 'fs';
import { diskStorage } from 'multer';
import {
  extname,
  resolve,
} from 'path';

import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { DocumentsService } from './documents.service';

const documentUploadDirectory =
  resolve(
    process.cwd(),
    'uploads',
    'documents',
  );

if (
  !existsSync(documentUploadDirectory)
) {
  mkdirSync(documentUploadDirectory, {
    recursive: true,
  });
}

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(
    private readonly service:
      DocumentsService,
  ) { }

  @Post('upload')
  @Permissions(
    PERMISSIONS.DOCUMENT_UPLOAD,
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: [
        'applicationId',
        'documentType',
        'file',
      ],
      properties: {
        applicationId: {
          type: 'number',
          example: 25,
        },
        documentType: {
          type: 'string',
          enum: [
            'PAN',
            'AADHAAR',
            'PHOTO',
            'BANK_STATEMENT',
            'PROPERTY_DOCUMENT',
            'INCOME_PROOF',
            'OTHER',
          ],
        },
        documentName: {
          type: 'string',
          example: 'PAN Card',
        },
        documentSource: {
          type: 'string',
          example: 'RM_PORTAL',
        },
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
        destination:
          documentUploadDirectory,

        filename: (
          _request,
          file,
          callback,
        ) => {
          const extension =
            extname(
              file.originalname,
            ).toLowerCase();

          const fileName =
            `${Date.now()}-${Math.round(
              Math.random() * 1e9,
            )}${extension}`;

          callback(null, fileName);
        },
      }),

      limits: {
        fileSize:
          15 * 1024 * 1024,
      },

      fileFilter: (
        _request,
        file,
        callback,
      ) => {
        const allowedMimeTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
        ];

        if (
          !allowedMimeTypes.includes(
            file.mimetype,
          )
        ) {
          return callback(
            new BadRequestException(
              'Only PDF, JPG, JPEG and PNG files are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  upload(
    @Body('applicationId')
    applicationId: string,

    @Body('documentType')
    documentType: string,

    @Body('documentName')
    documentName: string,

    @Body('documentSource')
    documentSource: string,

    @UploadedFile()
    file: Express.Multer.File,

    @CurrentUser()
    user: Actor,
  ) {
    return this.service.upload(
      {
        applicationId,
        documentType,
        documentName,
        documentSource,
      },
      file,
      user,
    );
  }

  @Get(':applicationId')
  @Permissions(
    PERMISSIONS.DOCUMENT_READ,
  )
  find(
    @Param(
      'applicationId',
      ParseIntPipe,
    )
    applicationId: number,
  ) {
    return this.service.findByApplication(
      applicationId,
    );
  }

  @Delete(':id')
  @Permissions(
    PERMISSIONS.DOCUMENT_DELETE,
  )
  remove(
    @Param('id', ParseIntPipe)
    id: number,
  ) {
    return this.service.remove(id);
  }
}