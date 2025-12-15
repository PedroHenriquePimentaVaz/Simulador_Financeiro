import { simulate } from '../src/utils/advancedCalculations.js';

interface TestScenario {
  name: string;
  investment: number;
  expectedStores: number;
  expectedFinalCashMin?: number;
  expectedFinalCashMax?: number;
  checkMonth13Store?: boolean;
}

const scenarios: TestScenario[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2, // Deve ter 2 lojas (1 inicial + 1 forçada no mês 13)
    checkMonth13Store: true,
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    checkMonth13Store: true,
  },
  {
    name: 'Investimento R$ 70.000 (não força loja, mas pode adicionar automaticamente)',
    investment: 70000,
    expectedStores: 1, // Pode ter mais, mas não é forçado
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 1, // Mínimo 1, pode ter mais
  },
];

function runTests() {
  console.log('🧪 Testando Cenários de Simulação\n');
  console.log('=' .repeat(80));

  let passed = 0;
  let failed = 0;

  for (const scenario of scenarios) {
    console.log(`\n📊 ${scenario.name}`);
    console.log(`   Investimento: R$ ${scenario.investment.toLocaleString('pt-BR')}`);

    try {
      // Testar cenário médio
      const result = simulate(
        2000, // lucro desejado
        scenario.investment,
        'proprio', // perfil operação
        60, // 60 meses
        'medio' // cenário
      );

      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      const finalCash = result.finalCash;
      const month13Result = result.monthlyResults.find(m => m.month === 13);

      console.log(`   ✅ Loja(s) final(is): ${finalStores}`);
      console.log(`   ✅ Saldo final: R$ ${finalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);

      // Verificar loja forçada no mês 13
      if (scenario.checkMonth13Store) {
        if (month13Result && month13Result.stores >= 2) {
          console.log(`   ✅ Loja forçada no mês 13: OK (${month13Result.stores} lojas)`);
        } else {
          console.log(`   ❌ Loja forçada no mês 13: FALHOU (${month13Result?.stores || 0} lojas)`);
          failed++;
          continue;
        }
      }

      // Verificar número de lojas
      if (finalStores >= scenario.expectedStores) {
        console.log(`   ✅ Número de lojas: OK`);
      } else {
        console.log(`   ❌ Número de lojas: Esperado >= ${scenario.expectedStores}, obtido ${finalStores}`);
        failed++;
        continue;
      }

      // Verificar saldo final (se especificado)
      if (scenario.expectedFinalCashMin !== undefined) {
        if (finalCash >= scenario.expectedFinalCashMin) {
          console.log(`   ✅ Saldo final mínimo: OK`);
        } else {
          console.log(`   ❌ Saldo final mínimo: Esperado >= ${scenario.expectedFinalCashMin}, obtido ${finalCash}`);
          failed++;
          continue;
        }
      }

      if (scenario.expectedFinalCashMax !== undefined) {
        if (finalCash <= scenario.expectedFinalCashMax) {
          console.log(`   ✅ Saldo final máximo: OK`);
        } else {
          console.log(`   ❌ Saldo final máximo: Esperado <= ${scenario.expectedFinalCashMax}, obtido ${finalCash}`);
          failed++;
          continue;
        }
      }

      // Verificar que saldo nunca ultrapassa o investimento inicial
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      if (minCash >= -scenario.investment) {
        console.log(`   ✅ Saldo nunca ultrapassa investimento: OK (mínimo: R$ ${minCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
      } else {
        console.log(`   ❌ Saldo ultrapassa investimento: FALHOU (mínimo: R$ ${minCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`);
        failed++;
        continue;
      }

      passed++;
      console.log(`   ✅ Cenário PASSOU`);
    } catch (error) {
      console.log(`   ❌ Erro ao executar: ${error}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Resumo dos Testes:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📊 Total: ${passed + failed}\n`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Revise os resultados acima.\n');
    process.exit(1);
  }
}

runTests();

