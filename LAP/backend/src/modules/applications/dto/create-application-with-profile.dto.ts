import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsInt, IsMobilePhone, IsNumber, IsNumberString, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { CustomerType, OccupationType } from '../../../common/enums/customer-profile.enum';

export class CreateApplicationWithProfileDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @IsMobilePhone('en-IN') mobile: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(10, 10) pan?: string;
  @ApiPropertyOptional() @IsOptional() @IsNumberString() requestedAmount?: string;

  @ApiPropertyOptional({ enum: CustomerType }) @IsOptional() @IsEnum(CustomerType) customerType?: CustomerType;
  @ApiPropertyOptional({ enum: OccupationType }) @IsOptional() @IsEnum(OccupationType) occupationType?: OccupationType;
  @ApiPropertyOptional() @IsOptional() @IsString() businessName?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() monthlyIncome?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() monthlyObligations?: number;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) firstName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) lastName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 80) middleName?: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(12, 12) aadhaarNumber?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() propertyCategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyType?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() marketValue?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyAddress?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyCity?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() propertyState?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(6, 6) propertyPincode?: string;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() requestedTenure?: number;

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() foir?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() eligibleAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() roi?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() tenure?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() emi?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() recommendedAmount?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() recommendedRoi?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() recommendedTenure?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() rmRecommendation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() remarks?: string;
}
