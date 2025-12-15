import { simulate } from '../src/utils/advancedCalculations';

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedForcedMonth?: number;
  scenario?: 'pessimista' | 'medio' | 'otimista';
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2,
    expectedForcedMonth: 13,
    scenario: 'medio'
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    expectedForcedMonth: 13,
    scenario: 'medio'
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode adicionar)',
    investment: 70000,
    expectedStores: 2,
    scenario: 'medio'
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 3,
    scenario: 'medio'
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
        testCase.scenario || 'medio'
      );

      const finalMonth = result.monthlyResults[result.monthlyResults.length - 1];
      const finalStores = finalMonth.stores;
      const finalCash = finalMonth.cumulativeCash;
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));

      // Verificar número de lojas
      const storesMatch = finalStores >= testCase.expectedStores;
      console.log(`  ✓ Lojas finais: ${finalStores} (esperado: ≥${testCase.expectedStores}) ${storesMatch ? '✅' : '❌'}`);

      // Verificar se saldo nunca ultrapassa limite
      const cashWithinLimit = minCash >= -testCase.investment;
      console.log(`  ✓ Saldo mínimo: ${formatCurrency(minCash)} (limite: ${formatCurrency(-testCase.investment)}) ${cashWithinLimit ? '✅' : '❌'}`);

      // Verificar loja forçada no mês 13
      if (testCase.expectedForcedMonth) {
        const month13Result = result.monthlyResults.find(m => m.month === testCase.expectedForcedMonth);
        const forcedStoreExists = month13Result && month13Result.stores >= testCase.expectedStores;
        console.log(`  ✓ Loja forçada no mês ${testCase.expectedForcedMonth}: ${forcedStoreExists ? '✅' : '❌'}`);
      }

      // Verificar se há lojas adicionadas antes do mês 13 (para <70k)
      if (testCase.investment < 70000 && testCase.expectedForcedMonth) {
        const beforeMonth13 = result.monthlyResults.filter(m => m.month < testCase.expectedForcedMonth! && m.stores > 1);
        const noEarlyStores = beforeMonth13.length === 0;
        console.log(`  ✓ Sem lojas antes do mês ${testCase.expectedForcedMonth}: ${noEarlyStores ? '✅' : '❌'}`);
      }

      // Mostrar resumo
      console.log(`  📈 Saldo final: ${formatCurrency(finalCash)}`);
      console.log(`  💰 ROI: ${result.roi.toFixed(2)}%`);
      console.log(`  ⏱️  Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);

      // Verificar se todos os checks passaram
      const allChecksPassed = storesMatch && cashWithinLimit && 
        (!testCase.expectedForcedMonth || (result.monthlyResults.find(m => m.month === testCase.expectedForcedMonth)?.stores || 0) >= testCase.expectedStores) &&
        (!(testCase.investment < 70000 && testCase.expectedForcedMonth) || result.monthlyResults.filter(m => m.month < testCase.expectedForcedMonth! && m.stores > 1).length === 0);

      if (allChecksPassed) {
        console.log(`  ✅ TESTE PASSOU`);
        passed++;
      } else {
        console.log(`  ❌ TESTE FALHOU`);
        failed++;
      }

    } catch (error) {
      console.error(`  ❌ ERRO: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Resumo dos Testes:`);
  console.log(`  ✅ Passou: ${passed}`);
  console.log(`  ❌ Falhou: ${failed}`);
  console.log(`  📈 Total: ${testCases.length}\n`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Revise os resultados acima.\n');
    process.exit(1);
  }
}

runTests();

