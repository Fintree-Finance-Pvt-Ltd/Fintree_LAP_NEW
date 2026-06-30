import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { PERMISSIONS } from '../../common/constants/permissions.constant';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import type { Actor } from '../applications/applications.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@ApiBearerAuth()
@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @Permissions(PERMISSIONS.DOCUMENT_UPLOAD)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['applicationId', 'documentType', 'file'], properties: { applicationId: { type: 'number' }, documentType: { type: 'string' }, documentName: { type: 'string' }, file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname)}`)
    }),
    limits: { fileSize: 15 * 1024 * 1024 }
  }))
  upload(@Body() dto: CreateDocumentDto, @UploadedFile() file: Express.Multer.File, @CurrentUser() user: Actor) {
    return this.service.upload(dto, file, user);
  }

  @Get(':applicationId') @Permissions(PERMISSIONS.DOCUMENT_READ)
  find(@Param('applicationId', ParseIntPipe) applicationId: number) { return this.service.findByApplication(applicationId); }

  @Delete(':id') @Permissions(PERMISSIONS.DOCUMENT_DELETE)
  remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}
