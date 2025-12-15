import { simulate } from '../src/utils/advancedCalculations';

type Scenario = {
  investment: number;
  desiredIncome: number;
  perfil: 'proprio' | 'terceirizar';
  cenario: 'pessimista' | 'medio' | 'otimista';
  months: number;
};

const scenarios: Scenario[] = [
  { investment: 55000, desiredIncome: 2000, perfil: 'proprio', cenario: 'medio', months: 60 },
  { investment: 69000, desiredIncome: 2000, perfil: 'proprio', cenario: 'medio', months: 60 },
  { investment: 70000, desiredIncome: 2000, perfil: 'proprio', cenario: 'medio', months: 60 },
  { investment: 120000, desiredIncome: 5000, perfil: 'proprio', cenario: 'medio', months: 60 }
];

function summarize(s: Scenario) {
  const result = simulate(s.desiredIncome, s.investment, s.perfil, s.months, s.cenario);
  const last = result.monthlyResults[result.monthlyResults.length - 1];
  const last12 = result.monthlyResults.slice(-12);
  const avgNet12 = last12.reduce((sum, m) => sum + m.netProfit, 0) / last12.length;
  return {
    investment: s.investment,
    cenario: s.cenario,
    perfil: s.perfil,
    payback: result.paybackPeriod,
    storesFinal: last.stores,
    finalCash: last.cumulativeCash,
    avgNetLast12: avgNet12
  };
}

const outputs = scenarios.map(summarize);
console.table(outputs);

