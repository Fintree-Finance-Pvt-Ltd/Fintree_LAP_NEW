import { IsMobilePhone, IsNumberString, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateApplicationDto {
  @IsString() @MaxLength(160) customerName: string;
  @IsMobilePhone('en-IN') mobile: string;
  @IsOptional() @IsString() @Length(10, 10) pan?: string;
  @IsOptional() @IsNumberString() requestedAmount?: string;
}
