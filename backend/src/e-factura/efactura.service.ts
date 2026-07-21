import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnafService } from '../anaf/anaf.service';
import { EfacturaApiService } from './efactura-api.service';
import { buildInvoiceXml } from './efactura-xml.builder';

@Injectable()
export class EfacturaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly anaf: AnafService,
    private readonly api: EfacturaApiService,
  ) {}

  private async loadInvoiceForXml(invoiceId: number) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true, client: true, series: true, tenant: true },
    });
    if (!invoice) {
      throw new NotFoundException(
        `Factura cu id ${invoiceId} nu a fost găsită.`,
      );
    }
    if (!invoice.tenant.cui) {
      throw new BadRequestException(
        'Firma ta (tenant) nu are CUI completat - necesar pentru e-Factura.',
      );
    }
    if (!invoice.tenant.addressStreet || !invoice.tenant.addressCity) {
      throw new BadRequestException(
        'Adresa firmei tale nu e completă - necesară pentru e-Factura (stradă, localitate).',
      );
    }
    return invoice;
  }

  /** Generează XML-ul fără să-l trimită - util pt. previzualizare/debug. */
  async previewXml(invoiceId: number) {
    const invoice = await this.loadInvoiceForXml(invoiceId);
    return buildInvoiceXml(invoice as any);
  }

  /** Validează XML-ul facturii direct la ANAF, fără să-l trimită efectiv. */
  async validate(invoiceId: number) {
    const invoice = await this.loadInvoiceForXml(invoiceId);
    const xml = buildInvoiceXml(invoice as any);
    const standard = invoice.documentType === 'STORNO' ? 'FCN' : 'FACT1';
    return this.api.validateXml(xml, standard);
  }

  /**
   * Trimite factura la ANAF. tenantId vine din request.user (JWT),
   * separat de invoice.tenantId ca dublă verificare de siguranță.
   */
  async send(tenantId: number, invoiceId: number) {
    const invoice = await this.loadInvoiceForXml(invoiceId);
    if (invoice.tenantId !== tenantId) {
      throw new BadRequestException('Factura nu aparține acestui tenant.');
    }
    if (invoice.anafStatus === 'OK') {
      throw new BadRequestException(
        'Factura a fost deja trimisă cu succes la ANAF.',
      );
    }

    const xml = buildInvoiceXml(invoice as any);
    const accessToken = await this.anaf.getValidAccessToken(tenantId);
    const cif = invoice.tenant.cui!.replace(/^RO/i, '');

    const result = await this.api.uploadInvoice(xml, cif, accessToken, 'UBL');

    // ANAF răspunde cu ExecutionStatus: '0' (succes) sau '1' (eroare), și index_incarcare la succes
    const success = result?.ExecutionStatus === '0';
    const uploadIndex = result?.index_incarcare;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        anafUploadIndex: success ? uploadIndex : null,
        anafStatus: success ? 'PROCESSING' : 'ERROR',
        anafSentAt: new Date(),
        anafErrorMessage: success
          ? null
          : JSON.stringify(result?.errors ?? result),
      },
    });

    return result;
  }

  /** Interoghează starea unei facturi trimise și actualizează statusul local. */
  async checkStatus(tenantId: number, invoiceId: number) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice)
      throw new NotFoundException(
        `Factura cu id ${invoiceId} nu a fost găsită.`,
      );
    if (!invoice.anafUploadIndex) {
      throw new BadRequestException('Factura nu a fost încă trimisă la ANAF.');
    }

    const accessToken = await this.anaf.getValidAccessToken(tenantId);
    const result = await this.api.getUploadStatus(
      invoice.anafUploadIndex,
      accessToken,
    );

    const stare = result?.stare;
    let anafStatus: 'PROCESSING' | 'OK' | 'ERROR' = 'PROCESSING';
    if (stare === 'ok') anafStatus = 'OK';
    else if (stare === 'nok' || result?.errors) anafStatus = 'ERROR';

    // id_descarcare e prezent atât la 'ok' cât și la 'nok' - îl salvăm ca să
    // poți descărca arhiva oricând, fără să reinterogăm ANAF.
    const downloadId = result?.id_descarcare ?? null;

    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        anafStatus,
        anafErrorMessage:
          anafStatus === 'ERROR' ? JSON.stringify(result) : null,
        anafDownloadId: downloadId,
        // odată confirmată de ANAF, factura nu mai e ciornă - devine emisă oficial
        ...(anafStatus === 'OK' ? { status: 'ISSUED' as const } : {}),
      },
    });

    return result;
  }

  /** Descarcă arhiva (factură validată + semnătură, sau erori + semnătură) după ce stare = ok/nok. */
  async downloadResult(tenantId: number, messageId: string) {
    const accessToken = await this.anaf.getValidAccessToken(tenantId);
    return this.api.download(messageId, accessToken);
  }

  /** Descarcă arhiva folosind ID-ul salvat deja pe factură (din ultima verificare de status). */
  async downloadStoredResponse(
    tenantId: number,
    invoiceId: number,
  ): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice)
      throw new NotFoundException(
        `Factura cu id ${invoiceId} nu a fost găsită.`,
      );
    if (!invoice.anafDownloadId) {
      throw new BadRequestException(
        'Nu există încă un răspuns ANAF de descărcat pentru această factură. Verifică mai întâi statusul.',
      );
    }
    return this.downloadResult(tenantId, invoice.anafDownloadId);
  }

  /** Listează mesajele disponibile (facturi trimise/primite/erori) pentru firma tenant-ului. */
  async listMessages(tenantId: number, zile = 10) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant?.cui) {
      throw new BadRequestException('Tenant-ul nu are CUI completat.');
    }
    const accessToken = await this.anaf.getValidAccessToken(tenantId);
    const cif = tenant.cui.replace(/^RO/i, '');
    return this.api.listMessages(cif, zile, accessToken);
  }
}
