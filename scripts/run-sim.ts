import { simulate } from '../src/utils/advancedCalculations.ts';

const cases = [55000, 69000, 70000, 120000];

for (const investimento of cases) {
  const result = simulate(2000, investimento, 'proprio', 60, 'medio');
  const last = result.monthlyResults[result.monthlyResults.length - 1];
  console.log('----');
  console.log(`Investimento: R$ ${investimento.toLocaleString('pt-BR')}`);
  console.log(`Lojas finais: ${last.stores}`);
  console.log(`Saldo final: ${last.cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`Payback: ${result.paybackPeriod || 'não alcançado'}`);
  console.log(`ROI mensal médio: ${result.roi.toFixed(2)}%`);
}

