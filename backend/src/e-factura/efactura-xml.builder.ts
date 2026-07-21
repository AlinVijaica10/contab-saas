import { create } from 'xmlbuilder2';

/**
 * Construiește XML-ul UBL 2.1 (specializare RO_CIUS) pentru o factură.
 *
 * IMPORTANT: structura minimă e conformă standardului UBL 2.1 Invoice
 * folosit de e-Factura. Recomandare fermă: ÎNTOTDEAUNA rulează
 * `EfacturaApiService.validateXml()` (endpoint-ul ANAF de validare,
 * gratuit și fără efecte secundare) înainte de upload real, mai ales
 * la primele facturi trimise - validatorul ANAF e sursa de adevăr,
 * nu presupunerile din acest generator.
 *
 * `invoice` trebuie încărcat cu: tenant, client, items, series.
 */

interface InvoiceForXml {
  id: number;
  number: number;
  issueDate: Date;
  dueDate: Date | null;
  currency: string;
  subtotal: number | string;
  vatTotal: number | string;
  total: number | string;
  documentType: 'NORMAL' | 'STORNO';
  series: { prefix: string; year: number };
  tenant: {
    name: string;
    cui: string | null;
    email: string;
    addressStreet: string | null;
    addressCity: string | null;
    addressCounty: string | null;
    addressPostalCode: string | null;
    addressCountry: string;
    iban: string | null;
    bankName: string | null;
  };
  client: {
    companyName: string;
    cui: string | null;
    contactEmail: string;
    addressStreet: string | null;
    addressCity: string | null;
    addressCounty: string | null;
    addressPostalCode: string | null;
    addressCountry: string;
  };
  items: Array<{
    description: string;
    quantity: number | string;
    unitOfMeasure: string;
    unitPrice: number | string;
    vatRate: number | string;
    vatExemptionReason: string | null;
    lineTotal: number | string;
  }>;
}

function num(v: number | string): number {
  if (typeof v === 'number') return v;
  return Number(v);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

/** Normalizează CIF-ul: dacă tenant/client e plătitor de TVA, ANAF cere prefixul RO fără spații. */
function normalizeCif(cui: string | null | undefined): string {
  if (!cui) return '';
  return cui.replace(/^RO/i, '').trim();
}

export function buildInvoiceXml(invoice: InvoiceForXml): string {
  const invoiceNumberFull = `${invoice.series.prefix}${invoice.number}`;
  const supplierCif = normalizeCif(invoice.tenant.cui);
  const customerCif = normalizeCif(invoice.client.cui);

  const invoiceTypeCode = invoice.documentType === 'STORNO' ? '381' : '380'; // 380=factură, 381=notă de credit

  const taxableAmount = num(invoice.subtotal);
  const taxAmount = num(invoice.vatTotal);

  // grupăm liniile pe cotă de TVA pentru secțiunea TaxSubtotal
  const vatGroups = new Map<
    string,
    { taxable: number; tax: number; exemptionReason: string | null }
  >();
  for (const item of invoice.items) {
    const rate = num(item.vatRate).toFixed(2);
    const lineTaxable = num(item.lineTotal);
    const lineTax = lineTaxable * (num(item.vatRate) / 100);
    const existing = vatGroups.get(rate);
    if (existing) {
      existing.taxable += lineTaxable;
      existing.tax += lineTax;
    } else {
      vatGroups.set(rate, {
        taxable: lineTaxable,
        tax: lineTax,
        exemptionReason: item.vatExemptionReason,
      });
    }
  }

  const doc = create({ version: '1.0', encoding: 'UTF-8' })
    .ele('Invoice', {
      xmlns: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
      'xmlns:cac':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2',
      'xmlns:cbc':
        'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
    })
    .ele('cbc:UBLVersionID')
    .txt('2.1')
    .up()
    .ele('cbc:CustomizationID')
    .txt(
      'urn:cen.eu:en16931:2017#compliant#urn:efactura.mfinante.ro:CIUS-RO:1.0.1',
    )
    .up()
    .ele('cbc:ID')
    .txt(invoiceNumberFull)
    .up()
    .ele('cbc:IssueDate')
    .txt(formatDate(invoice.issueDate))
    .up();

  // BR-CO-25: dacă suma de plată e pozitivă, trebuie prezent DueDate sau PaymentTerms.
  // Punem mereu DueDate; dacă nu a fost setat de user, folosim data emiterii ca fallback.
  const effectiveDueDate = invoice.dueDate ?? invoice.issueDate;
  doc.ele('cbc:DueDate').txt(formatDate(effectiveDueDate)).up();

  doc
    .ele('cbc:InvoiceTypeCode')
    .txt(invoiceTypeCode)
    .up()
    .ele('cbc:DocumentCurrencyCode')
    .txt(invoice.currency)
    .up();

  // ---- Furnizor (Supplier) ----
  const supplierParty = doc.ele('cac:AccountingSupplierParty').ele('cac:Party');
  supplierParty
    .ele('cac:PartyName')
    .ele('cbc:Name')
    .txt(invoice.tenant.name)
    .up()
    .up()
    .ele('cac:PostalAddress')
    .ele('cbc:StreetName')
    .txt(invoice.tenant.addressStreet ?? '')
    .up()
    .ele('cbc:CityName')
    .txt(invoice.tenant.addressCity ?? '')
    .up()
    .ele('cbc:PostalZone')
    .txt(invoice.tenant.addressPostalCode ?? '')
    .up()
    .ele('cbc:CountrySubentity')
    .txt(invoice.tenant.addressCounty ?? '')
    .up()
    .ele('cac:Country')
    .ele('cbc:IdentificationCode')
    .txt(invoice.tenant.addressCountry)
    .up()
    .up()
    .up()
    .ele('cac:PartyTaxScheme')
    .ele('cbc:CompanyID')
    .txt(`RO${supplierCif}`)
    .up()
    .ele('cac:TaxScheme')
    .ele('cbc:ID')
    .txt('VAT')
    .up()
    .up()
    .up()
    .ele('cac:PartyLegalEntity')
    .ele('cbc:RegistrationName')
    .txt(invoice.tenant.name)
    .up()
    .ele('cbc:CompanyID')
    .txt(supplierCif)
    .up();

  // ---- Client (Customer) ----
  const customerParty = doc.ele('cac:AccountingCustomerParty').ele('cac:Party');
  customerParty
    .ele('cac:PartyName')
    .ele('cbc:Name')
    .txt(invoice.client.companyName)
    .up()
    .up()
    .ele('cac:PostalAddress')
    .ele('cbc:StreetName')
    .txt(invoice.client.addressStreet ?? '')
    .up()
    .ele('cbc:CityName')
    .txt(invoice.client.addressCity ?? '')
    .up()
    .ele('cbc:PostalZone')
    .txt(invoice.client.addressPostalCode ?? '')
    .up()
    .ele('cbc:CountrySubentity')
    .txt(invoice.client.addressCounty ?? '')
    .up()
    .ele('cac:Country')
    .ele('cbc:IdentificationCode')
    .txt(invoice.client.addressCountry)
    .up()
    .up()
    .up()
    .ele('cac:PartyTaxScheme')
    .ele('cbc:CompanyID')
    .txt(customerCif ? `RO${customerCif}` : '')
    .up()
    .ele('cac:TaxScheme')
    .ele('cbc:ID')
    .txt('VAT')
    .up()
    .up()
    .up()
    .ele('cac:PartyLegalEntity')
    .ele('cbc:RegistrationName')
    .txt(invoice.client.companyName)
    .up()
    .ele('cbc:CompanyID')
    .txt(customerCif)
    .up();

  // ---- Modalitate de plată (IBAN) - opțional ----
  if (invoice.tenant.iban) {
    doc
      .ele('cac:PaymentMeans')
      .ele('cbc:PaymentMeansCode')
      .txt('30')
      .up() // 30 = credit transfer
      .ele('cac:PayeeFinancialAccount')
      .ele('cbc:ID')
      .txt(invoice.tenant.iban)
      .up();
  }

  // ---- TVA (TaxTotal + subtotaluri per cotă) ----
  const taxTotal = doc.ele('cac:TaxTotal');
  taxTotal
    .ele('cbc:TaxAmount', { currencyID: invoice.currency })
    .txt(taxAmount.toFixed(2))
    .up();

  for (const [rate, group] of vatGroups) {
    const subtotal = taxTotal.ele('cac:TaxSubtotal');
    subtotal
      .ele('cbc:TaxableAmount', { currencyID: invoice.currency })
      .txt(group.taxable.toFixed(2))
      .up()
      .ele('cbc:TaxAmount', { currencyID: invoice.currency })
      .txt(group.tax.toFixed(2))
      .up()
      .ele('cac:TaxCategory')
      .ele('cbc:ID')
      .txt(parseFloat(rate) === 0 ? 'Z' : 'S')
      .up() // S=standard, Z=zero rated
      .ele('cbc:Percent')
      .txt(rate)
      .up();
    if (parseFloat(rate) === 0 && group.exemptionReason) {
      subtotal.last().ele('cbc:TaxExemptionReason').txt(group.exemptionReason);
    }
    subtotal.last().ele('cac:TaxScheme').ele('cbc:ID').txt('VAT').up();
  }

  // ---- Totaluri ----
  doc
    .ele('cac:LegalMonetaryTotal')
    .ele('cbc:LineExtensionAmount', { currencyID: invoice.currency })
    .txt(taxableAmount.toFixed(2))
    .up()
    .ele('cbc:TaxExclusiveAmount', { currencyID: invoice.currency })
    .txt(taxableAmount.toFixed(2))
    .up()
    .ele('cbc:TaxInclusiveAmount', { currencyID: invoice.currency })
    .txt(num(invoice.total).toFixed(2))
    .up()
    .ele('cbc:PayableAmount', { currencyID: invoice.currency })
    .txt(num(invoice.total).toFixed(2))
    .up();

  // ---- Linii factură ----
  invoice.items.forEach((item, idx) => {
    const rate = num(item.vatRate);
    const line = doc.ele('cac:InvoiceLine');
    line
      .ele('cbc:ID')
      .txt(String(idx + 1))
      .up()
      .ele('cbc:InvoicedQuantity', { unitCode: item.unitOfMeasure })
      .txt(num(item.quantity).toString())
      .up()
      .ele('cbc:LineExtensionAmount', { currencyID: invoice.currency })
      .txt(num(item.lineTotal).toFixed(2))
      .up()
      .ele('cac:Item')
      .ele('cbc:Name')
      .txt(item.description)
      .up()
      .ele('cac:ClassifiedTaxCategory')
      .ele('cbc:ID')
      .txt(rate === 0 ? 'Z' : 'S')
      .up()
      .ele('cbc:Percent')
      .txt(rate.toFixed(2))
      .up()
      .ele('cac:TaxScheme')
      .ele('cbc:ID')
      .txt('VAT')
      .up()
      .up()
      .up()
      .up()
      .ele('cac:Price')
      .ele('cbc:PriceAmount', { currencyID: invoice.currency })
      .txt(num(item.unitPrice).toFixed(2));
  });

  return doc.end({ prettyPrint: true });
}
