import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application } from '../applications/entities/application.entity';
import type { Actor } from '../applications/applications.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { Document } from './entities/document.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document) private readonly documents: Repository<Document>,
    @InjectRepository(Application) private readonly applications: Repository<Application>
  ) {}

  async upload(dto: CreateDocumentDto, file: Express.Multer.File, actor: Actor) {
    if (!file) throw new BadRequestException('Document file is required');
    if (!(await this.applications.exist({ where: { id: dto.applicationId } }))) throw new NotFoundException('Application not found');
    return {
      data: await this.documents.save(this.documents.create({
        applicationId: dto.applicationId,
        documentType: dto.documentType,
        documentName: dto.documentName ?? dto.documentType,
        fileName: file.originalname,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedBy: actor.id,
        createdBy: actor.id,
        updatedBy: actor.id
      }))
    };
  }

  async findByApplication(applicationId: number) {
    return { data: await this.documents.find({ where: { applicationId }, order: { id: 'DESC' } }) };
  }

  async remove(id: number) {
    const result = await this.documents.delete(id);
    if (!result.affected) throw new NotFoundException('Document not found');
    return { data: null, message: 'Document deleted' };
  }
}
