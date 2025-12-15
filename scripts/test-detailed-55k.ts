import { simulate } from '../src/utils/advancedCalculations';
import { formatCurrency } from '../src/utils/advancedCalculations';

console.log('🔍 Teste detalhado para investimento de R$ 55.000\n');

const result = simulate(
  2000, // lucro desejado
  55000, // investimento
  'proprio', // perfil operação
  60, // meses
  'medio' // cenário
);

console.log('📊 Análise mês a mês (meses 10-15):\n');

for (let month = 10; month <= 15; month++) {
  const monthData = result.monthlyResults.find(m => m.month === month);
  if (monthData) {
    console.log(`Mês ${month}:`);
    console.log(`  Lojas: ${monthData.stores}`);
    console.log(`  Saldo acumulado: ${formatCurrency(monthData.cumulativeCash)}`);
    console.log(`  Lucro líquido: ${formatCurrency(monthData.netProfit)}`);
    console.log(`  Fluxo de caixa: ${formatCurrency(monthData.cashFlow)}`);
    if (monthData.container > 0 || monthData.refrigerator > 0) {
      console.log(`  ⚠️ CAPEX pago: Container ${formatCurrency(monthData.container)}, Geladeira ${formatCurrency(monthData.refrigerator)}`);
    }
    console.log('');
  }
}

console.log(`\n📈 Resumo final:`);
console.log(`  Total de lojas no mês 60: ${result.monthlyResults[result.monthlyResults.length - 1].stores}`);
console.log(`  Saldo final: ${formatCurrency(result.finalCash)}`);
console.log(`  Saldo mínimo: ${formatCurrency(Math.min(...result.monthlyResults.map(m => m.cumulativeCash)))}`);

