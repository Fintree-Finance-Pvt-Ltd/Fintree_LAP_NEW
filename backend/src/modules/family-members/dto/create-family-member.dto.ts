import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFamilyMemberDto {
  @IsNumber()
  applicationId: number;

  @IsString()
  @MaxLength(140)
  name: string;

  @IsString()
  @MaxLength(50)
  relation: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  occupation?: string;

  @IsOptional()
  @IsNumber()
  income?: number;
}
