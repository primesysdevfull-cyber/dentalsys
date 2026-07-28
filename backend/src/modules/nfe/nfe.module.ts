import { Module } from '@nestjs/common';
import { NfeController } from './nfe.controller';
import { NfeService } from './nfe.service';
import { NfeConfigService } from './nfe-config.service';
import { BlingService } from './providers/bling.service';
import { TinyService } from './providers/tiny.service';

@Module({
  controllers: [NfeController],
  providers: [NfeService, NfeConfigService, BlingService, TinyService],
  exports: [NfeService],
})
export class NfeModule {}
