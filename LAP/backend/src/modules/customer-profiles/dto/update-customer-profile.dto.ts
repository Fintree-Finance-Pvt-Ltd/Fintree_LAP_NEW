import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCustomerProfileDto } from './create-customer-profile.dto';

export class UpdateCustomerProfileDto extends PartialType(OmitType(CreateCustomerProfileDto, ['applicationId'] as const)) {}
