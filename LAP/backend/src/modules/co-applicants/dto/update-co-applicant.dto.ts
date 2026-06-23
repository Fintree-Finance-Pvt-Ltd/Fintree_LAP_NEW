import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCoApplicantDto } from './create-co-applicant.dto';

export class UpdateCoApplicantDto extends PartialType(OmitType(CreateCoApplicantDto, ['applicationId'] as const)) {}
