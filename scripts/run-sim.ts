import { simulate, formatCurrency } from '../src/utils/advancedCalculations';

type ScenarioInput = {
  investimentoInicial: number;
  lucroDesejado?: number;
  perfilOperacao?: 'proprio' | 'terceirizar';
  months?: number;
  cenario?: 'pessimista' | 'medio' | 'otimista';
};

const scenarios: ScenarioInput[] = [
  { investimentoInicial: 55000 },
  { investimentoInicial: 69000 },
  { investimentoInicial: 70000 },
  { investimentoInicial: 120000 }
];

function runScenario(input: ScenarioInput) {
  const {
    investimentoInicial,
    lucroDesejado = 2000,
    perfilOperacao = 'proprio',
    months = 60,
    cenario = 'medio'
  } = input;

  const result = simulate(lucroDesejado, investimentoInicial, perfilOperacao, months, cenario);
  const last = result.monthlyResults[result.monthlyResults.length - 1];
  const lastNet = last.netProfit;

  return {
    investimentoInicial,
    stores: last.stores,
    finalCash: result.finalCash,
    payback: result.paybackPeriod,
    roiMonthlyPct: result.roi,
    lastNet
  };
}

function fmtPct(value: number) {
  return `${value.toFixed(2)}%`;
}

console.log('--- Cenários rápidos (60 meses, perfil próprio, cenário médio) ---');
scenarios.forEach((scenario) => {
  const r = runScenario(scenario);
  console.log(
    `Inv R$ ${r.investimentoInicial.toLocaleString('pt-BR')}: ` +
      `Lojas=${r.stores}, ` +
      `Payback=${r.payback || 'n/alcançado'}, ` +
      `ROI(mensal)=${fmtPct(r.roiMonthlyPct)}, ` +
      `Lucro líquido último mês=${formatCurrency(r.lastNet)}, ` +
      `Saldo final=${formatCurrency(r.finalCash)}`
  );
});


