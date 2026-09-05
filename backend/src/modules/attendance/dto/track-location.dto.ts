import { IsNumber, IsOptional, IsString, MaxLength } from 'class-validator';

export class TrackLocationDto {
  @IsOptional()
  @IsNumber()
  attendanceId?: number;

  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  locationName?: string;
}
