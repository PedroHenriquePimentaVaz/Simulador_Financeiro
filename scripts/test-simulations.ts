import { simulate } from '../src/utils/advancedCalculations.ts';
import behonestParams from '../behonest_params.json' assert { type: 'json' };

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedForcedStoreMonth?: number;
  minFinalCash?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2,
    expectedForcedStoreMonth: 13,
    minFinalCash: -55000 // Não pode ultrapassar o investimento
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    expectedForcedStoreMonth: 13,
    minFinalCash: -69000
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode adicionar)',
    investment: 70000,
    expectedStores: 2, // Pode ter 2 lojas se o caixa permitir
    minFinalCash: -70000
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 3, // Taxa 30k + 3 lojas (20k cada) = 90k, sobra 30k
    minFinalCash: -120000
  }
];

console.log('🧪 Iniciando testes de simulação...\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  console.log(`\n📊 Teste: ${testCase.name}`);
  console.log('-'.repeat(80));
  
  try {
    // Testar cenário médio
    const result = simulate(
      2000, // lucro desejado
      testCase.investment,
      'proprio', // perfil operação
      60, // 60 meses
      'medio' // cenário médio
    );
    
    const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
    const finalCash = result.finalCash;
    
    // Verificar número de lojas
    const storesMatch = finalStores >= testCase.expectedStores;
    if (!storesMatch) {
      console.log(`❌ FALHOU: Esperava pelo menos ${testCase.expectedStores} loja(s), mas tem ${finalStores}`);
      failedTests++;
    } else {
      console.log(`✅ Lojas: ${finalStores} (esperado: ≥${testCase.expectedStores})`);
      passedTests++;
    }
    
    // Verificar loja forçada no mês 13 (se aplicável)
    if (testCase.expectedForcedStoreMonth) {
      const month13Result = result.monthlyResults.find(r => r.month === 13);
      if (month13Result && month13Result.stores >= 2) {
        console.log(`✅ Loja forçada no mês 13: ${month13Result.stores} loja(s)`);
        passedTests++;
      } else {
        console.log(`❌ FALHOU: Esperava loja forçada no mês 13, mas tem ${month13Result?.stores || 0} loja(s)`);
        failedTests++;
      }
    }
    
    // Verificar saldo mínimo
    if (testCase.minFinalCash !== undefined) {
      const minCashOk = finalCash >= testCase.minFinalCash;
      if (!minCashOk) {
        console.log(`❌ FALHOU: Saldo final (${finalCash.toFixed(2)}) ultrapassou o limite (${testCase.minFinalCash})`);
        failedTests++;
      } else {
        console.log(`✅ Saldo final: R$ ${finalCash.toFixed(2)} (limite: ${testCase.minFinalCash})`);
        passedTests++;
      }
    }
    
    // Verificar se em algum momento o saldo ultrapassou o limite
    const maxNegativeCash = Math.min(...result.monthlyResults.map(r => r.cumulativeCash));
    if (maxNegativeCash < -testCase.investment) {
      console.log(`❌ FALHOU: Saldo mínimo (${maxNegativeCash.toFixed(2)}) ultrapassou o investimento (${-testCase.investment})`);
      failedTests++;
    } else {
      console.log(`✅ Saldo nunca ultrapassou o investimento inicial`);
      passedTests++;
    }
    
    // Mostrar alguns meses chave
    const month2 = result.monthlyResults.find(r => r.month === 2);
    const month12 = result.monthlyResults.find(r => r.month === 12);
    const month13 = result.monthlyResults.find(r => r.month === 13);
    const month60 = result.monthlyResults[result.monthlyResults.length - 1];
    
    console.log(`\n📅 Meses chave:`);
    console.log(`   Mês 2: ${month2?.stores || 0} loja(s), Saldo: R$ ${month2?.cumulativeCash.toFixed(2) || '0.00'}`);
    if (month12) {
      console.log(`   Mês 12: ${month12.stores} loja(s), Saldo: R$ ${month12.cumulativeCash.toFixed(2)}`);
    }
    if (month13) {
      console.log(`   Mês 13: ${month13.stores} loja(s), Saldo: R$ ${month13.cumulativeCash.toFixed(2)}`);
    }
    console.log(`   Mês 60: ${month60.stores} loja(s), Saldo: R$ ${month60.cumulativeCash.toFixed(2)}`);
    
  } catch (error) {
    console.log(`❌ ERRO: ${error instanceof Error ? error.message : String(error)}`);
    failedTests++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📈 Resumo dos Testes:`);
console.log(`   ✅ Passou: ${passedTests}`);
console.log(`   ❌ Falhou: ${failedTests}`);
console.log(`   📊 Total: ${passedTests + failedTests}\n`);

if (failedTests === 0) {
  console.log('🎉 Todos os testes passaram!');
  process.exit(0);
} else {
  console.log('⚠️  Alguns testes falharam. Revise os resultados acima.');
  process.exit(1);
}

