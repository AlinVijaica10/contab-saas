interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  lineTotal: number;
}

interface InvoiceTemplateData {
  seriesPrefix: string;
  number: number;
  year: number;
  issueDate: Date;
  dueDate?: Date | null;
  currency: string;
  subtotal: number;
  vatTotal: number;
  total: number;
  notes?: string | null;
  client: {
    companyName: string;
    cui?: string | null;
    contactEmail: string;
  };
  tenant: {
    name: string;
    cui?: string | null;
    email: string;
  };
  items: InvoiceItemData[];
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ro-RO').format(new Date(date));
}

function formatMoney(value: number, currency: string): string {
  return `${value.toFixed(2)} ${currency}`;
}

export function renderInvoiceHtml(data: InvoiceTemplateData): string {
  const itemsRows = data.items
    .map(
      (item) => `
        <tr>
          <td>${item.description}</td>
          <td class="num">${item.quantity}</td>
          <td class="num">${formatMoney(item.unitPrice, data.currency)}</td>
          <td class="num">${item.vatRate}%</td>
          <td class="num">${formatMoney(item.lineTotal, data.currency)}</td>
        </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; font-size: 11pt; color: #222; padding: 40px; }
  .header { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .header h1 { font-size: 22px; text-transform: uppercase; }
  .header .invoice-number { font-size: 14px; color: #555; }
  .parties { display: flex; justify-content: space-between; margin-bottom: 30px; }
  .party { width: 45%; }
  .party h3 { font-size: 11px; text-transform: uppercase; color: #888; margin-bottom: 6px; }
  .party p { line-height: 1.5; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th, td { padding: 8px 10px; border-bottom: 1px solid #ddd; text-align: left; }
  th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; color: #666; }
  td.num, th.num { text-align: right; }
  .totals { width: 300px; margin-left: auto; }
  .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #222; padding-top: 8px; margin-top: 4px; }
  .notes { margin-top: 30px; font-size: 10px; color: #666; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Factură</h1>
      <div class="invoice-number">${data.seriesPrefix}-${data.year}-${String(data.number).padStart(4, '0')}</div>
    </div>
    <div>
      <p><strong>Data emiterii:</strong> ${formatDate(data.issueDate)}</p>
      <p><strong>Data scadenței:</strong> ${formatDate(data.dueDate)}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Furnizor</h3>
      <p><strong>${data.tenant.name}</strong></p>
      ${data.tenant.cui ? `<p>CUI: ${data.tenant.cui}</p>` : ''}
      <p>${data.tenant.email}</p>
    </div>
    <div class="party">
      <h3>Client</h3>
      <p><strong>${data.client.companyName}</strong></p>
      ${data.client.cui ? `<p>CUI: ${data.client.cui}</p>` : ''}
      <p>${data.client.contactEmail}</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Descriere</th>
        <th class="num">Cantitate</th>
        <th class="num">Preț unitar</th>
        <th class="num">TVA</th>
        <th class="num">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <div class="totals">
    <div><span>Subtotal</span><span>${formatMoney(data.subtotal, data.currency)}</span></div>
    <div><span>TVA</span><span>${formatMoney(data.vatTotal, data.currency)}</span></div>
    <div class="grand-total"><span>Total</span><span>${formatMoney(data.total, data.currency)}</span></div>
  </div>

  ${data.notes ? `<div class="notes">${data.notes}</div>` : ''}
</body>
</html>`;
}
