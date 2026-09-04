import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class StartWorkDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  spoke?: string;
}
