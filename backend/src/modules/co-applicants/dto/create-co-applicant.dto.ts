import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsMobilePhone, IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCoApplicantDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsInt() id?: number;
  @ApiProperty() @Type(() => Number) @IsInt() applicationId: number;
  @ApiProperty() @IsString() @Length(1, 140) name: string;
  @ApiProperty() @IsMobilePhone('en-IN') mobile: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Matches(/^[A-Z]{5}[0-9]{4}[A-Z]$/) panNumber?: string;
  @ApiProperty() @IsString() @Length(1, 80) relationship: string;
  @ApiPropertyOptional() @IsOptional() @IsString() occupation?: string;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() monthlyIncome?: number;
}
