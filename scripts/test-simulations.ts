import { simulate, formatCurrency } from '../src/utils/advancedCalculations';

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedMonth13Store?: boolean;
  minFinalCash?: number;
  maxFinalCash?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (< 70k)',
    investment: 55000,
    expectedStores: 2,
    expectedMonth13Store: true,
    minFinalCash: -55000,
  },
  {
    name: 'Investimento R$ 69.000 (< 70k)',
    investment: 69000,
    expectedStores: 2,
    expectedMonth13Store: true,
    minFinalCash: -69000,
  },
  {
    name: 'Investimento R$ 70.000 (limite)',
    investment: 70000,
    expectedStores: 2,
    expectedMonth13Store: false,
    minFinalCash: -70000,
  },
  {
    name: 'Investimento R$ 120.000 (> 70k)',
    investment: 120000,
    expectedStores: 3,
    expectedMonth13Store: false,
    minFinalCash: -120000,
  },
];

function runTests() {
  console.log('🧪 Iniciando testes de simulação...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log('─'.repeat(60));
    
    try {
      // Testar cenário médio
      const result = simulate(
        2000, // lucro desejado
        testCase.investment,
        'proprio', // perfil operação
        60, // 60 meses
        'medio' // cenário
      );
      
      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      const finalCash = result.finalCash;
      
      // Verificar número de lojas
      const storesCheck = finalStores >= testCase.expectedStores;
      console.log(`  ✓ Lojas finais: ${finalStores} (esperado: ≥${testCase.expectedStores}) ${storesCheck ? '✅' : '❌'}`);
      
      // Verificar loja no mês 13 (para investimentos < 70k)
      let hasStoreInMonth13 = false;
      if (testCase.expectedMonth13Store !== undefined) {
        const month13Stores = result.monthlyResults.find(m => m.month === 13)?.stores || 0;
        const month12Stores = result.monthlyResults.find(m => m.month === 12)?.stores || 0;
        hasStoreInMonth13 = month13Stores > month12Stores;
        
        if (testCase.expectedMonth13Store) {
          console.log(`  ✓ Loja adicionada no mês 13: ${hasStoreInMonth13 ? 'Sim ✅' : 'Não ❌'}`);
          if (!hasStoreInMonth13) {
            console.log(`    ⚠️  Mês 12: ${month12Stores} lojas, Mês 13: ${month13Stores} lojas`);
            // Verificar se há loja no mês 12 (pagamento)
            const month12Cash = result.monthlyResults.find(m => m.month === 12)?.cumulativeCash || 0;
            const month11Cash = result.monthlyResults.find(m => m.month === 11)?.cumulativeCash || 0;
            console.log(`    ⚠️  Caixa Mês 11: ${formatCurrency(month11Cash)}, Mês 12: ${formatCurrency(month12Cash)}`);
          }
        } else {
          console.log(`  ✓ Loja NÃO forçada no mês 13: ${!hasStoreInMonth13 ? 'OK ✅' : 'Forçada ❌'}`);
        }
      }
      
      // Verificar saldo mínimo
      if (testCase.minFinalCash !== undefined) {
        const minCheck = finalCash >= testCase.minFinalCash;
        console.log(`  ✓ Saldo final: ${formatCurrency(finalCash)} (mínimo: ${formatCurrency(testCase.minFinalCash)}) ${minCheck ? '✅' : '❌'}`);
      }
      
      // Verificar se saldo nunca ultrapassa limite
      const maxNegativeCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      const neverExceedsLimit = maxNegativeCash >= -testCase.investment;
      console.log(`  ✓ Saldo nunca ultrapassa limite: ${neverExceedsLimit ? '✅' : '❌'} (mínimo: ${formatCurrency(maxNegativeCash)})`);
      
      // Verificar payback
      console.log(`  ✓ Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
      
      // Verificar ROI
      console.log(`  ✓ ROI mensal: ${result.roi.toFixed(2)}%`);
      
      // Verificar evolução de lojas
      const month2Stores = result.monthlyResults.find(m => m.month === 2)?.stores || 0;
      const month3Stores = result.monthlyResults.find(m => m.month === 3)?.stores || 0;
      console.log(`  ✓ Evolução: Mês 2: ${month2Stores} loja(s), Mês 3: ${month3Stores} loja(s), Final: ${finalStores} loja(s)`);
      
      // Verificar se todas as verificações passaram
      const allChecksPassed = storesCheck && 
        (testCase.expectedMonth13Store === undefined || 
         (testCase.expectedMonth13Store ? hasStoreInMonth13 : !hasStoreInMonth13)) &&
        (testCase.minFinalCash === undefined || finalCash >= testCase.minFinalCash) &&
        neverExceedsLimit;
      
      if (allChecksPassed) {
        console.log(`\n  ✅ TESTE PASSOU`);
        passed++;
      } else {
        console.log(`\n  ❌ TESTE FALHOU`);
        failed++;
      }
      
    } catch (error) {
      console.error(`  ❌ ERRO: ${error}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📈 Resumo: ${passed} passaram, ${failed} falharam`);
  console.log('='.repeat(60));
  
  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram!');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise os resultados acima.');
  }
}

runTests();

