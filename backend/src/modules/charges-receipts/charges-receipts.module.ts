import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChargesReceiptsController } from './charges-receipts.controller';
import { ChargesReceiptsService } from './charges-receipts.service';
import { ChargesReceipt } from './entities/charges-receipt.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChargesReceipt])],
  controllers: [ChargesReceiptsController],
  providers: [ChargesReceiptsService],
  exports: [ChargesReceiptsService],
})
export class ChargesReceiptsModule {}