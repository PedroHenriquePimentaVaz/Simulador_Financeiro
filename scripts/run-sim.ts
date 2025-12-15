import { simulate } from '../src/utils/advancedCalculations.ts';

type Scenario = 'pessimista' | 'medio' | 'otimista';

const cases = [
  { investimento: 55000, perfil: 'proprio', cenario: 'medio' as Scenario },
  { investimento: 69000, perfil: 'proprio', cenario: 'medio' as Scenario },
  { investimento: 70000, perfil: 'proprio', cenario: 'medio' as Scenario },
  { investimento: 120000, perfil: 'proprio', cenario: 'medio' as Scenario },
];

function summarize(result: ReturnType<typeof simulate>) {
  const last = result.monthlyResults[result.monthlyResults.length - 1];
  const last12 = result.monthlyResults.slice(-12);
  const avgLast12 = last12.reduce((s, m) => s + m.netProfit, 0) / last12.length;
  return {
    stores: last.stores,
    finalCash: last.cumulativeCash,
    payback: result.paybackPeriod,
    roi: result.roi,
    avgNetProfitLast12: avgLast12,
  };
}

for (const c of cases) {
  const res = simulate(2000, c.investimento, c.perfil, 60, c.cenario);
  const summary = summarize(res);
  console.log(`\n=== Investimento ${c.investimento} | perfil ${c.perfil} | cenário ${c.cenario} ===`);
  console.table(summary);
}

