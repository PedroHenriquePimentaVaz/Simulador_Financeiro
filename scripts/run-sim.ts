import { simulate, formatCurrency } from '../src/utils/advancedCalculations.ts';

type Scenario = {
  label: string;
  investimento: number;
  lucroDesejado: number;
  perfil: 'proprio' | 'terceirizar';
  meses?: number;
  cenario?: 'pessimista' | 'medio' | 'otimista';
};

const scenarios: Scenario[] = [
  { label: '55k', investimento: 55_000, lucroDesejado: 2_000, perfil: 'proprio' },
  { label: '69k', investimento: 69_000, lucroDesejado: 2_000, perfil: 'proprio' },
  { label: '70k', investimento: 70_000, lucroDesejado: 2_000, perfil: 'proprio' },
  { label: '120k', investimento: 120_000, lucroDesejado: 2_000, perfil: 'proprio' },
];

function runScenario(s: Scenario) {
  const result = simulate(
    s.lucroDesejado,
    s.investimento,
    s.perfil,
    s.meses ?? 60,
    s.cenario ?? 'medio'
  );

  const last = result.monthlyResults[result.monthlyResults.length - 1];
  const last12 = result.monthlyResults.slice(-12);
  const avgNet12 =
    last12.reduce((sum, m) => sum + m.netProfit, 0) / (last12.length || 1);

  return {
    label: s.label,
    investimento: s.investimento,
    cenario: s.cenario ?? 'medio',
    perfil: s.perfil,
    totalStores: last.stores,
    finalCash: result.finalCash,
    payback: result.paybackPeriod,
    roi: result.roi,
    avgNet12,
    lastNet: last.netProfit,
  };
}

const rows = scenarios.map(runScenario);

console.log('=== Simulações (60 meses) ===');
for (const r of rows) {
  console.log(
    [
      `Cenário ${r.label}`,
      `Investimento: ${formatCurrency(r.investimento)}`,
      `Lojas finais: ${r.totalStores}`,
      `Payback: ${r.payback || 'não atingiu'}`,
      `ROI (média 12m finais): ${r.roi.toFixed(2)}%`,
      `Lucro médio últimos 12m: ${formatCurrency(r.avgNet12)}`,
      `Lucro último mês: ${formatCurrency(r.lastNet)}`,
      `Saldo final: ${formatCurrency(r.finalCash)}`,
    ].join(' | ')
  );
}

