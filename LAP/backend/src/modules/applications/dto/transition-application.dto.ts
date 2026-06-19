import { IsInt, IsString, MaxLength } from 'class-validator';

export class TransitionApplicationDto {
  @IsString() action: 'SUBMIT_TO_BM' | 'BM_APPROVE';
  @IsString() @MaxLength(500) remarks: string;
  @IsInt() expectedVersion: number;
}
