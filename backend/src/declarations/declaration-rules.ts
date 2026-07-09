export type DeclarationType =
  | 'D100' | 'D101' | 'BILANT' | 'D300' | 'D390' | 'D394' | 'D112' | 'D212' | 'D205';

export type Periodicity = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';

interface ClientFiscalProfile {
  clientType: 'SRL' | 'PFA';
  fiscalRegime: 'MICRO' | 'PROFIT' | 'REAL' | 'NORMA_VENIT';
  isVatPayer: boolean;
  vatPeriodicity: 'MONTHLY' | 'QUARTERLY' | null;
  hasEmployees: boolean;
}

interface DeclarationRule {
  type: DeclarationType;
  label: string;
  appliesTo: (client: ClientFiscalProfile) => boolean;
  periodicity: (client: ClientFiscalProfile) => Periodicity;
  annualDueMonth?: number; // doar pentru periodicitate ANNUAL
}

const QUARTER_END_MONTHS = [3, 6, 9, 12];

const RULES: DeclarationRule[] = [
  {
    type: 'D100',
    label: 'D100 - Impozit micro/profit',
    appliesTo: (c) => c.clientType === 'SRL',
    periodicity: () => 'QUARTERLY',
  },
  {
    type: 'D101',
    label: 'D101 - Impozit pe profit anual',
    appliesTo: (c) => c.clientType === 'SRL' && c.fiscalRegime === 'PROFIT',
    periodicity: () => 'ANNUAL',
    annualDueMonth: 3,
  },
  {
    type: 'BILANT',
    label: 'Bilanț anual',
    appliesTo: (c) => c.clientType === 'SRL',
    periodicity: () => 'ANNUAL',
    annualDueMonth: 5,
  },
  {
    type: 'D300',
    label: 'D300 - Decont TVA',
    appliesTo: (c) => c.isVatPayer,
    periodicity: (c) => c.vatPeriodicity ?? 'MONTHLY',
  },
  {
    type: 'D390',
    label: 'D390 - Declarație recapitulativă intracomunitară',
    appliesTo: (c) => c.isVatPayer,
    periodicity: () => 'QUARTERLY',
  },
  {
    type: 'D394',
    label: 'D394 - Informativă livrări/achiziții',
    appliesTo: (c) => c.isVatPayer,
    periodicity: () => 'QUARTERLY',
  },
  {
    type: 'D112',
    label: 'D112 - Contribuții și impozit salariați',
    appliesTo: (c) => c.hasEmployees,
    periodicity: () => 'MONTHLY',
  },
  {
    type: 'D212',
    label: 'D212 - Declarația unică PFA',
    appliesTo: (c) => c.clientType === 'PFA',
    periodicity: () => 'ANNUAL',
    annualDueMonth: 5,
  },
  {
    type: 'D205',
    label: 'D205 - Impozit reținut la sursă',
    appliesTo: (c) => c.clientType === 'SRL',
    periodicity: () => 'ANNUAL',
    annualDueMonth: 2,
  },
];

export function getApplicableDeclarations(
  client: ClientFiscalProfile,
  month: number,
): { type: DeclarationType; label: string }[] {
  return RULES.filter((rule) => {
    if (!rule.appliesTo(client)) return false;

    const periodicity = rule.periodicity(client);

    if (periodicity === 'MONTHLY') return true;
    if (periodicity === 'QUARTERLY') return QUARTER_END_MONTHS.includes(month);
    if (periodicity === 'ANNUAL') return rule.annualDueMonth === month;

    return false;
  }).map((rule) => ({ type: rule.type, label: rule.label }));
}
