import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { DocumentType } from '../../../common/enums/document-type.enum';

export class CreateDocumentDto {
  @ApiProperty() @Type(() => Number) @IsInt() applicationId: number;
  @ApiProperty({ enum: DocumentType }) @IsEnum(DocumentType) documentType: DocumentType;
  @ApiPropertyOptional() @IsOptional() @IsString() documentName?: string;
}
