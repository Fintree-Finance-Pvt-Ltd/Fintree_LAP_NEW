import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsMobilePhone, IsNumber, IsOptional, IsString, Length } from 'class-validator';

export class CreateCoApplicantDto {
  @ApiProperty() @Type(() => Number) @IsInt() applicationId: number;
  @ApiProperty() @IsString() @Length(1, 140) name: string;
  @ApiProperty() @IsMobilePhone('en-IN') mobile: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(10, 10) panNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(12, 12) aadhaarNumber?: string;
  @ApiProperty() @IsString() @Length(1, 80) relationship: string;
  @ApiPropertyOptional() @IsOptional() @IsString() occupation?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() monthlyIncome?: number;
}
