import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsMobilePhone, IsOptional, IsString, Length } from 'class-validator';

export class CreateContactPersonDto {
  @ApiProperty() @Type(() => Number) @IsInt() applicationId: number;
  @ApiProperty() @IsString() @Length(1, 140) name: string;
  @ApiProperty() @IsMobilePhone('en-IN') mobile: string;
  @ApiPropertyOptional() @IsOptional() @IsEmail() email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(1, 120) designation?: string;
  @ApiProperty() @IsString() @Length(1, 80) relationship: string;
}
