import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { create } from 'xmlbuilder2';

const BASE_URL =
  process.env.ANAF_EFACTURA_ENV === 'production'
    ? 'https://api.anaf.ro/prod/FCTEL/rest'
    : 'https://api.anaf.ro/test/FCTEL/rest';

const VALIDATE_URL = 'https://webservicesp.anaf.ro/prod/FCTEL/rest/validare';

export type UploadStandard = 'UBL' | 'CN' | 'CII' | 'RASP';

/**
 * ANAF răspunde la upload/stareMesaj cu un XML de forma:
 * <header ... ExecutionStatus="0" index_incarcare="123"/>
 * sau, la eroare:
 * <header ExecutionStatus="1"><Errors errorMessage="..."/></header>
 * Parsăm asta într-un obiect JS simplu, sigur de trimis ca JSON către frontend.
 */
function parseAnafXmlResponse(xml: string): Record<string, any> {
  try {
    const obj: any = create(xml).end({ format: 'object' });
    const header = obj?.header ?? obj;
    const flat: Record<string, any> = {};
    for (const [key, value] of Object.entries(header)) {
      if (key.startsWith('@')) flat[key.slice(1)] = value;
    }
    if (header?.Errors) {
      const errors = Array.isArray(header.Errors)
        ? header.Errors
        : [header.Errors];
      flat.errors = errors.map((e: any) => e['@errorMessage'] ?? e);
    }
    return flat;
  } catch {
    // dacă nu e XML valid (ex: deja JSON), întoarcem textul brut într-un wrapper
    return { raw: xml };
  }
}

@Injectable()
export class EfacturaApiService {
  private readonly logger = new Logger(EfacturaApiService.name);

  constructor(private readonly http: HttpService) {}

  /**
   * Validează un XML fără să-l trimită efectiv (fără autentificare, endpoint separat).
   * val1 acceptat conform doc ANAF: FACT1 (factură) sau FCN (credit note).
   */
  async validateXml(xml: string, standard: 'FACT1' | 'FCN' = 'FACT1') {
    try {
      const response = await firstValueFrom(
        this.http.post(`${VALIDATE_URL}/${standard}`, xml, {
          headers: { 'Content-Type': 'text/plain' },
          responseType: 'text',
        }),
      );
      // răspunsul de validare pare să fie JSON în majoritatea cazurilor documentate,
      // dar cerem 'text' ca să nu pice parsarea dacă vine XML - încercăm ambele.
      try {
        return JSON.parse(response.data as unknown as string);
      } catch {
        return parseAnafXmlResponse(response.data as unknown as string);
      }
    } catch (err: any) {
      this.logger.error(
        'Eroare la validarea XML pe ANAF',
        err?.response?.data || err.message,
      );
      throw new BadRequestException(
        err?.response?.data || 'Nu s-a putut valida XML-ul la ANAF.',
      );
    }
  }

  /**
   * Încarcă XML-ul facturii. Necesită access_token valid (OAuth2).
   * Răspunsul ANAF e XML (header cu atribute) - îl parsăm într-un obiect simplu:
   * { ExecutionStatus: '0'|'1', index_incarcare?: string, errors?: string[] }
   */
  async uploadInvoice(
    xml: string,
    cif: string,
    accessToken: string,
    standard: UploadStandard = 'UBL',
  ) {
    try {
      const response = await firstValueFrom(
        this.http.post(`${BASE_URL}/upload`, xml, {
          params: { standard, cif },
          headers: {
            'Content-Type': 'application/xml',
            Authorization: `Bearer ${accessToken}`,
          },
          responseType: 'text',
        }),
      );
      return parseAnafXmlResponse(response.data as unknown as string);
    } catch (err: any) {
      this.logger.error(
        'Eroare la upload factură ANAF',
        err?.response?.data || err.message,
      );
      throw new BadRequestException(
        parseAnafXmlResponse(err?.response?.data ?? '') ||
          'Nu s-a putut încărca factura la ANAF.',
      );
    }
  }

  /** Verifică stadiul procesării unei facturi trimise (ok / nok / in prelucrare). Răspuns XML, parsat similar. */
  async getUploadStatus(uploadIndex: string, accessToken: string) {
    const response = await firstValueFrom(
      this.http.get(`${BASE_URL}/stareMesaj`, {
        params: { id_incarcare: uploadIndex },
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'text',
      }),
    );
    return parseAnafXmlResponse(response.data as unknown as string);
  }

  /** Listează mesajele disponibile pentru un CIF, în ultimele `zile` zile. */
  async listMessages(
    cif: string,
    zile: number,
    accessToken: string,
    filtru?: 'E' | 'T' | 'P' | 'R',
  ) {
    const response = await firstValueFrom(
      this.http.get(`${BASE_URL}/listaMesajeFactura`, {
        params: { zile, cif, ...(filtru ? { filtru } : {}) },
        headers: { Authorization: `Bearer ${accessToken}` },
      }),
    );
    return response.data;
  }

  /** Descarcă arhiva ZIP (factură + semnătură MF, sau erori + semnătură) pentru un mesaj. */
  async download(id: string, accessToken: string): Promise<Buffer> {
    const response = await firstValueFrom(
      this.http.get(`${BASE_URL}/descarcare`, {
        params: { id },
        headers: { Authorization: `Bearer ${accessToken}` },
        responseType: 'arraybuffer',
      }),
    );
    return Buffer.from(response.data as ArrayBuffer);
  }
}
