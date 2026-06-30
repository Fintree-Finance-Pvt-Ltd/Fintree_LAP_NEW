import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateContactPersonDto } from './create-contact-person.dto';

export class UpdateContactPersonDto extends PartialType(OmitType(CreateContactPersonDto, ['applicationId'] as const)) {}
