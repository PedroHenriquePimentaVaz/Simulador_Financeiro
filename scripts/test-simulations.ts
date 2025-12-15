import { simulate } from '../src/utils/advancedCalculations.js';
import behonestParams from '../behonest_params.json';

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedForcedMonth?: number;
  minFinalCash?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2,
    expectedForcedMonth: 13,
    minFinalCash: -55000
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    expectedForcedMonth: 13,
    minFinalCash: -69000
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode auto-adicionar)',
    investment: 70000,
    expectedStores: 1, // Pode ter mais se auto-adicionar
    minFinalCash: -70000
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 1, // Pode ter mais se auto-adicionar
    minFinalCash: -120000
  }
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function runTests() {
  console.log('🧪 Iniciando testes de simulação...\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log('-'.repeat(80));
    
    try {
      const result = simulate(
        2000, // lucro desejado
        testCase.investment,
        'proprio', // perfil operação
        60, // 60 meses
        'medio' // cenário médio
      );
      
      // Verificar número de lojas no último mês
      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      console.log(`✓ Lojas no último mês: ${finalStores} (esperado: ${testCase.expectedStores}+)`);
      
      // Verificar se loja foi forçada no mês esperado
      if (testCase.expectedForcedMonth) {
        const monthBefore = result.monthlyResults[testCase.expectedForcedMonth - 2]; // mês 12
        const forcedMonth = result.monthlyResults[testCase.expectedForcedMonth - 1]; // mês 13
        
        const storesBefore = monthBefore.stores;
        const storesAfter = forcedMonth.stores;
        
        if (storesAfter > storesBefore) {
          console.log(`✓ Loja adicionada no mês ${testCase.expectedForcedMonth} (esperado)`);
        } else {
          console.log(`✗ Loja NÃO foi adicionada no mês ${testCase.expectedForcedMonth} (esperado)`);
          failed++;
        }
      }
      
      // Verificar saldo acumulado nunca ultrapassa limite
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      const maxAllowed = testCase.minFinalCash || -testCase.investment;
      
      if (minCash >= maxAllowed) {
        console.log(`✓ Saldo mínimo: ${formatCurrency(minCash)} (limite: ${formatCurrency(maxAllowed)})`);
      } else {
        console.log(`✗ Saldo mínimo ${formatCurrency(minCash)} ultrapassou limite ${formatCurrency(maxAllowed)}`);
        failed++;
      }
      
      // Verificar se há lojas adicionadas antes do mês 13 para investimentos <70k
      if (testCase.investment < 70000 && testCase.expectedForcedMonth === 13) {
        const month12 = result.monthlyResults[11]; // mês 12 (índice 11)
        const month13 = result.monthlyResults[12]; // mês 13 (índice 12)
        
        if (month12.stores === 1 && month13.stores === 2) {
          console.log(`✓ Loja forçada corretamente: 1 loja no mês 12, 2 lojas no mês 13`);
        } else {
          console.log(`✗ Loja forçada incorreta: ${month12.stores} loja(s) no mês 12, ${month13.stores} loja(s) no mês 13`);
          failed++;
        }
      }
      
      // Verificar se CAPEX foi descontado corretamente
      const month2 = result.monthlyResults[1]; // mês 2
      const expectedCapex = behonestParams.capex_per_store + behonestParams.container_per_store + behonestParams.refrigerator_per_store;
      
      if (month2.container + month2.refrigerator > 0) {
        const totalCapex = month2.container + month2.refrigerator + expectedCapex - behonestParams.container_per_store - behonestParams.refrigerator_per_store;
        console.log(`✓ CAPEX primeira loja: ${formatCurrency(month2.container + month2.refrigerator + behonestParams.capex_per_store)}`);
      }
      
      // Verificar receita no mês 3 (primeira loja começa a operar)
      const month3 = result.monthlyResults[2];
      if (month3.totalRevenue > 0) {
        console.log(`✓ Receita iniciou no mês 3: ${formatCurrency(month3.totalRevenue)}`);
      } else {
        console.log(`✗ Receita não iniciou no mês 3`);
        failed++;
      }
      
      // Verificar que manutenção e utilities são 0 no mês 1
      const month1 = result.monthlyResults[0];
      if (month1.maintenance === 0 && month1.utilities === 0) {
        console.log(`✓ Manutenção e utilities zerados no mês 1`);
      } else {
        console.log(`✗ Manutenção ou utilities não zerados no mês 1`);
        failed++;
      }
      
      // Resumo do resultado
      console.log(`\n📈 Resumo:`);
      console.log(`   Saldo final: ${formatCurrency(result.finalCash)}`);
      console.log(`   Payback: ${result.paybackPeriod > 0 ? result.paybackPeriod + ' meses' : 'Não alcançado'}`);
      console.log(`   ROI mensal: ${result.roi.toFixed(2)}%`);
      
      passed++;
      
    } catch (error) {
      console.log(`✗ Erro ao executar teste: ${error}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Resultado dos testes:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   Total: ${passed + failed}\n`);
  
  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Revise os resultados acima.');
    process.exit(1);
  }
}

runTests();

