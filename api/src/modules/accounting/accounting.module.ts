import { Module } from '@nestjs/common';
import { EinvoiceModule } from '@modules/einvoice/einvoice.module';
import { AccountingController } from '@modules/accounting/accounting.controller';
import { PartiesService } from '@modules/accounting/parties.service';
import { InvoicesService } from '@modules/accounting/invoices.service';
import { CashService } from '@modules/accounting/cash.service';
import { StockLedgerService } from '@modules/accounting/stock-ledger.service';
import { OkcImportService } from '@modules/accounting/okc-import.service';
import { ReportsService } from '@modules/accounting/reports.service';
import { SyncService } from '@modules/accounting/sync.service';
import { AccountingSettingsService } from '@modules/accounting/settings.service';

@Module({
  imports: [EinvoiceModule],
  controllers: [AccountingController],
  providers: [
    PartiesService,
    InvoicesService,
    CashService,
    StockLedgerService,
    OkcImportService,
    ReportsService,
    SyncService,
    AccountingSettingsService,
  ],
  exports: [StockLedgerService, CashService, InvoicesService],
})
export class AccountingModule {}
