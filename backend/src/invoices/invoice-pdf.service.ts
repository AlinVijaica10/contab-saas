import { Injectable } from '@nestjs/common';
import puppeteer from 'puppeteer';
import { renderInvoiceHtml } from './templates/invoice-template';

@Injectable()
export class InvoicePdfService {
  async generatePdf(invoice: any): Promise<Buffer> {
    const html = renderInvoiceHtml({
      seriesPrefix: invoice.series.prefix,
      number: invoice.number,
      year: invoice.series.year,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      currency: invoice.currency,
      subtotal: Number(invoice.subtotal),
      vatTotal: Number(invoice.vatTotal),
      total: Number(invoice.total),
      notes: invoice.notes,
      client: invoice.client,
      tenant: invoice.tenant,
      items: invoice.items.map((item: any) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        vatRate: Number(item.vatRate),
        lineTotal: Number(item.lineTotal),
      })),
    });

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
      });
      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
