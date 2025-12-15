import { simulate } from '../src/utils/advancedCalculations.ts';

const currency = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(v);

type ScenarioInput = {
  investimentoInicial: number;
  lucroDesejado: number;
  perfilOperacao: 'proprio' | 'terceirizar';
  cenario: 'pessimista' | 'medio' | 'otimista';
};

const scenarios: ScenarioInput[] = [
  { investimentoInicial: 55000, lucroDesejado: 2000, perfilOperacao: 'proprio', cenario: 'medio' },
  { investimentoInicial: 69000, lucroDesejado: 2000, perfilOperacao: 'proprio', cenario: 'medio' },
  { investimentoInicial: 70000, lucroDesejado: 2000, perfilOperacao: 'proprio', cenario: 'medio' },
  { investimentoInicial: 120000, lucroDesejado: 2000, perfilOperacao: 'proprio', cenario: 'medio' }
];

function summarize(result: ReturnType<typeof simulate>) {
  const { monthlyResults, totalInvestment, paybackPeriod, roi, finalCash } = result;
  const last12 = monthlyResults.slice(-12);
  const avgLast12Net = last12.reduce((s, m) => s + m.netProfit, 0) / last12.length;
  const lastMonth = monthlyResults[monthlyResults.length - 1];
  return {
    storesLastMonth: lastMonth.stores,
    payback: paybackPeriod || null,
    roiMonthly: roi,
    finalCash,
    avgLast12Net,
    totalInvestment
  };
}

function runScenario(input: ScenarioInput) {
  const res = simulate(input.lucroDesejado, input.investimentoInicial, input.perfilOperacao, 60, input.cenario);
  const s = summarize(res);
  console.log('---');
  console.log(
    `Investimento: ${currency(input.investimentoInicial)} | Cenario: ${input.cenario} | Perfil: ${input.perfilOperacao}`
  );
  console.log(`Lojas no último mês: ${s.storesLastMonth}`);
  console.log(`Payback (meses): ${s.payback ?? 'não atingido'}`);
  console.log(`ROI médio mensal: ${s.roiMonthly.toFixed(2)}%`);
  console.log(`Lucro médio últimos 12 meses: ${currency(s.avgLast12Net)}`);
  console.log(`Saldo final 5 anos: ${currency(s.finalCash)}`);
  console.log(`Investimento total: ${currency(s.totalInvestment)}`);
}

for (const scenario of scenarios) {
  runScenario(scenario);
}

