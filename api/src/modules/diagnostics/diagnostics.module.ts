import { Module } from '@nestjs/common';
import { DiagnosticsController } from '@modules/diagnostics/diagnostics.controller';
import { DiagnosticsService } from '@modules/diagnostics/diagnostics.service';

@Module({
  controllers: [DiagnosticsController],
  providers: [DiagnosticsService],
  exports: [DiagnosticsService],
})
export class DiagnosticsModule {}
