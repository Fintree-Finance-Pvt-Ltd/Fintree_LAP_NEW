import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackLocationDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  attendanceId?: number;

  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  speed?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;
}
