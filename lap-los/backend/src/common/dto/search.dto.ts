import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SearchDto {
  @IsOptional() @IsString() @MaxLength(100) q?: string;
}
