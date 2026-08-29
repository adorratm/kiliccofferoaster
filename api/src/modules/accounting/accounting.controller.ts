import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Roles } from '@common/decorators/roles.decorator';
import { OPS_ROLES } from '@entities/user.entity';
import { PartiesService } from '@modules/accounting/parties.service';
import { InvoicesService } from '@modules/accounting/invoices.service';
import { CashService } from '@modules/accounting/cash.service';
import { StockLedgerService } from '@modules/accounting/stock-ledger.service';
import { OkcImportService } from '@modules/accounting/okc-import.service';
import { ReportsService } from '@modules/accounting/reports.service';
import { SyncService } from '@modules/accounting/sync.service';
import { AccountingSettingsService } from '@modules/accounting/settings.service';
import {
  CashEntryQueryDto,
  CreateCashAccountDto,
  CreateCashEntryDto,
  CreateInvoiceDto,
  ConvertToInvoiceDto,
  CreatePartyDto,
  CreateStockMovementDto,
  ImportOkcDto,
  InvoiceQueryDto,
  PartyQueryDto,
  ReportsQueryDto,
  StockMovementQueryDto,
  SyncPullDto,
  SyncPushDto,
  UpdateAccountingSettingsDto,
  UpdateCashAccountDto,
  UpdateInvoiceDto,
  UpdatePartyDto,
  AccountingQueryDto,
} from '@modules/accounting/dto/accounting.dto';
import { EDocumentType } from '@entities/invoice.entity';

@ApiTags('accounting')
@ApiBearerAuth()
@Roles(...OPS_ROLES)
@Controller('accounting')
export class AccountingController {
  constructor(
    private readonly parties: PartiesService,
    private readonly invoices: InvoicesService,
    private readonly cash: CashService,
    private readonly stock: StockLedgerService,
    private readonly okc: OkcImportService,
    private readonly reports: ReportsService,
    private readonly sync: SyncService,
    private readonly settings: AccountingSettingsService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.settings.get();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateAccountingSettingsDto) {
    return this.settings.update(dto);
  }

  @Get('parties')
  listParties(@Query() query: PartyQueryDto) {
    return this.parties.list(query);
  }

  @Post('parties')
  createParty(@Body() dto: CreatePartyDto) {
    return this.parties.create(dto);
  }

  @Get('parties/:id')
  getParty(@Param('id') id: string) {
    return this.parties.findOne(id);
  }

  @Get('parties/:id/statement')
  partyStatement(@Param('id') id: string) {
    return this.parties.statement(id);
  }

  @Patch('parties/:id')
  updateParty(@Param('id') id: string, @Body() dto: UpdatePartyDto) {
    return this.parties.update(id, dto);
  }

  @Delete('parties/:id')
  removeParty(@Param('id') id: string) {
    return this.parties.remove(id);
  }

  @Get('invoices')
  listInvoices(@Query() query: InvoiceQueryDto) {
    return this.invoices.list(query);
  }

  @Post('invoices')
  createInvoice(@Body() dto: CreateInvoiceDto) {
    return this.invoices.create(dto);
  }

  @Post('invoices/from-order/:orderId')
  fromOrder(@Param('orderId') orderId: string) {
    return this.invoices.fromOrder(orderId);
  }

  @Post('invoices/:id/to-invoice')
  @ApiOperation({ summary: 'Fişi e-arşiv/e-faturaya çevir' })
  toInvoice(
    @Param('id') id: string,
    @Body() dto: ConvertToInvoiceDto,
  ) {
    return this.invoices.toInvoice(id, dto);
  }

  @Post('invoices/:id/to-receipt')
  @ApiOperation({ summary: 'Faturayı iç fişe geri çevir (taslak)' })
  toReceipt(@Param('id') id: string) {
    return this.invoices.toReceipt(id);
  }

  @Get('invoices/:id')
  getInvoice(@Param('id') id: string) {
    return this.invoices.findOne(id);
  }

  @Patch('invoices/:id')
  updateInvoice(@Param('id') id: string, @Body() dto: UpdateInvoiceDto) {
    return this.invoices.update(id, dto);
  }

  @Post('invoices/:id/queue')
  queueInvoice(@Param('id') id: string) {
    return this.invoices.queue(id);
  }

  @Post('invoices/:id/send')
  sendInvoice(@Param('id') id: string) {
    return this.invoices.send(id);
  }

  @Post('invoices/:id/cancel')
  cancelInvoice(@Param('id') id: string) {
    return this.invoices.cancel(id);
  }

  @Get('invoices/:id/print')
  @ApiOperation({ summary: 'Fatura yazdırma modeli' })
  printInvoice(@Param('id') id: string) {
    return this.invoices.printModel(id);
  }

  @Get('invoices/:id/html')
  async invoiceHtml(@Param('id') id: string, @Res() res: Response) {
    const { invoice, settings } = await this.invoices.printModel(id);
    const isReceipt = invoice.edocumentType === EDocumentType.NONE;
    const docLabel = isReceipt
      ? 'Satış Fişi'
      : invoice.edocumentType === EDocumentType.EINVOICE
        ? 'e-Fatura'
        : 'e-Arşiv Fatura';
    const lines = (invoice.lines || [])
      .map(
        (l) =>
          `<tr><td>${escapeHtml(l.description)}</td><td>${l.quantity}</td><td>${l.unitPrice}</td><td>${l.vatRate}%</td><td>${l.lineTotal}</td></tr>`,
      )
      .join('');
    const html = `<!doctype html><html lang="tr"><head><meta charset="utf-8"/><title>${escapeHtml(invoice.invoiceNumber)}</title>
<style>
body{font-family:Inter,system-ui,sans-serif;background:#131313;color:#e5e2e1;padding:32px}
h1{letter-spacing:.08em;text-transform:uppercase;font-size:18px}
table{width:100%;border-collapse:collapse;margin-top:24px}
td,th{border:1px solid #57423d;padding:8px;text-align:left;font-size:13px}
.meta{color:#a58b84;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.accent{color:#cc5b3e}
</style></head><body>
<p class="meta">Kılıç Coffee Roaster // ${escapeHtml(docLabel)}</p>
<h1>${escapeHtml(settings.companyTitle)}</h1>
<p>${escapeHtml(invoice.invoiceNumber)} · ${invoice.issueDate} · <span class="accent">${escapeHtml(docLabel)}</span></p>
<p>Cari: ${escapeHtml(invoice.party?.title || '—')} ${invoice.party?.taxNumber || ''}</p>
<table><thead><tr><th>Açıklama</th><th>Miktar</th><th>Birim</th><th>KDV</th><th>Toplam</th></tr></thead>
<tbody>${lines}</tbody></table>
<p>Ara ${invoice.subtotal} · KDV ${invoice.taxAmount} · <strong>Genel ${invoice.total} ${invoice.currency}</strong></p>
<p class="meta">${isReceipt ? 'İç satış fişi · GİB gönderimi yok' : `GİB gönderimi internet bağlantısı gerektirir. Durum: ${invoice.status}`}</p>
</body></html>`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  @Get('cash/accounts')
  cashAccounts() {
    return this.cash.accountBalances();
  }

  @Post('cash/accounts')
  createCashAccount(@Body() dto: CreateCashAccountDto) {
    return this.cash.createAccount(dto);
  }

  @Patch('cash/accounts/:id')
  updateCashAccount(@Param('id') id: string, @Body() dto: UpdateCashAccountDto) {
    return this.cash.updateAccount(id, dto);
  }

  @Get('cash/entries')
  cashEntries(@Query() query: CashEntryQueryDto) {
    return this.cash.listEntries(query);
  }

  @Post('cash/entries')
  createCashEntry(@Body() dto: CreateCashEntryDto) {
    return this.cash.createEntry(dto);
  }

  @Post('cash/sync-paytr')
  syncPaytr() {
    return this.cash.syncPaytrPayments();
  }

  @Get('stock')
  stockSnapshot() {
    return this.stock.snapshot();
  }

  @Get('stock/movements')
  stockMovements(@Query() query: StockMovementQueryDto) {
    return this.stock.list(query);
  }

  @Post('stock/movements')
  createStockMovement(@Body() dto: CreateStockMovementDto) {
    return this.stock.create(dto);
  }

  @Get('okc')
  okcList(@Query() query: AccountingQueryDto) {
    return this.okc.list(query);
  }

  @Post('okc/import')
  okcImport(@Body() dto: ImportOkcDto) {
    return this.okc.importRows(dto);
  }

  @Get('reports/turnover')
  turnover(@Query() query: ReportsQueryDto) {
    return this.reports.turnover(query);
  }

  @Get('reports/vat')
  vat(@Query() query: ReportsQueryDto) {
    return this.reports.vat(query);
  }

  @Get('reports/cash')
  cashBook(@Query() query: ReportsQueryDto) {
    return this.reports.cashBook(query);
  }

  @Get('reports/stock')
  stockReport() {
    return this.reports.stock();
  }

  @Get('reports/parties/:id')
  partyReport(@Param('id') id: string, @Query() query: ReportsQueryDto) {
    return this.reports.partyStatement(id, query);
  }

  @Post('sync/push')
  syncPush(@Body() dto: SyncPushDto) {
    return this.sync.push(dto);
  }

  @Get('sync/pull')
  syncPull(@Query() query: SyncPullDto) {
    return this.sync.pull(query);
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
