import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ClaimCategory,
  ClaimStatus,
  PaymentStatus,
} from '../entities/lap-claim.entity';

export class CreateClaimDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  title: string;

  @IsNotEmpty()
  @IsEnum(ClaimCategory)
  category: ClaimCategory;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  taxAmount?: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(10)
  expenseDate: string; // YYYY-MM-DD

  @IsOptional()
  @IsString()
  @MaxLength(255)
  merchantName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  invoiceNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gstNumber?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @IsOptional()
  @IsString()
  receiptOriginalName?: string;

  @IsOptional()
  @IsString()
  receiptMimeType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  receiptSize?: number;

  @IsOptional()
  @IsString()
  ocrRawText?: string;
}

export class ApproveClaimDto {
  @IsOptional()
  @IsString()
  adminRemarks?: string;
}

export class RejectClaimDto {
  @IsNotEmpty()
  @IsString()
  adminRemarks: string;
}

export class UpdatePaymentStatusDto {
  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;

  @IsOptional()
  @IsString()
  paymentDate?: string;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class QueryClaimsDto {
  @IsOptional()
  @IsEnum(ClaimStatus)
  status?: ClaimStatus;

  @IsOptional()
  @IsEnum(ClaimCategory)
  category?: ClaimCategory;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number = 50;
}
