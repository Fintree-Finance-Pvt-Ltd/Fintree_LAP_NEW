import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateVisitDto {
  @IsString() visitType: string;
  @IsOptional() @IsString() latitude?: string;
  @IsOptional() @IsString() longitude?: string;
  @IsOptional() @IsString() @MaxLength(1000) remarks?: string;
}
