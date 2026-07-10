// src/co-applicants/dto/save-co-applicants-bulk.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsArray, ValidateNested } from 'class-validator';
import { CreateCoApplicantDto } from './create-co-applicant.dto';

export class SaveCoApplicantsBulkDto {
  @ApiProperty()
  @Type(() => Number)
  @IsInt()
  applicationId: number;

  @ApiProperty({ type: [CreateCoApplicantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCoApplicantDto)
  coApplicants: CreateCoApplicantDto[];
}