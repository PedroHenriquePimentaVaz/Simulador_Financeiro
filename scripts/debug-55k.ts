import { simulate } from '../src/utils/advancedCalculations.js';

console.log('🔍 Debug: Investimento R$ 55.000\n');

const result = simulate(2000, 55000, 'proprio', 60, 'medio');

console.log('Mês 11:');
const month11 = result.monthlyResults.find(m => m.month === 11);
if (month11) {
  console.log(`  Saldo acumulado: R$ ${month11.cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lucro líquido: R$ ${month11.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Fluxo de caixa: R$ ${month11.cashFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lojas: ${month11.stores}`);
}

console.log('\nMês 12:');
const month12 = result.monthlyResults.find(m => m.month === 12);
if (month12) {
  console.log(`  Saldo acumulado: R$ ${month12.cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lucro líquido: R$ ${month12.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Fluxo de caixa: R$ ${month12.cashFlow.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Container CAPEX: R$ ${month12.container.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Geladeira CAPEX: R$ ${month12.refrigerator.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lojas: ${month12.stores}`);
  
  const capexTotal = 20000 + 1275 + 600;
  const availableCashBeforeCapex = month11 ? month11.cumulativeCash + month12.netProfit : 0;
  const availableCashAfterCapex = availableCashBeforeCapex - capexTotal;
  const limit = -55000;
  
  console.log(`\n  Verificações:`);
  console.log(`  • Caixa disponível antes CAPEX: R$ ${availableCashBeforeCapex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  • Caixa disponível após CAPEX: R$ ${availableCashAfterCapex.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  • Limite do investimento: R$ ${limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  • Pode adicionar? ${availableCashAfterCapex >= limit ? 'SIM' : 'NÃO'}`);
}

console.log('\nMês 13:');
const month13 = result.monthlyResults.find(m => m.month === 13);
if (month13) {
  console.log(`  Saldo acumulado: R$ ${month13.cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lucro líquido: R$ ${month13.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
  console.log(`  Lojas: ${month13.stores}`);
}

