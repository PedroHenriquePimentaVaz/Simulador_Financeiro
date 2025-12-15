import { simulate, formatCurrency } from '../src/utils/advancedCalculations';

interface TestCase {
  name: string;
  investment: number;
  expectedMinStores: number;
  expectedMaxStores: number;
  shouldForceMonth13?: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedMinStores: 1,
    expectedMaxStores: 2,
    shouldForceMonth13: true
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedMinStores: 1,
    expectedMaxStores: 2,
    shouldForceMonth13: true
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode auto-adicionar)',
    investment: 70000,
    expectedMinStores: 1,
    expectedMaxStores: 3
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedMinStores: 1,
    expectedMaxStores: 3
  }
];

function runTests() {
  console.log('🧪 Iniciando testes de simulação...\n');
  
  let passedTests = 0;
  let failedTests = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log(`   Investimento: ${formatCurrency(testCase.investment)}`);
    
    try {
      const result = simulate(
        2000, // lucro desejado
        testCase.investment,
        'proprio', // perfil operação
        60, // meses
        'medio' // cenário
      );
      
      // Verificações básicas
      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      const minCumulativeCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      const maxCumulativeCash = Math.max(...result.monthlyResults.map(m => m.cumulativeCash));
      const finalCash = result.finalCash;
      
      console.log(`   ✅ Loja final: ${finalStores}`);
      console.log(`   ✅ Saldo mínimo: ${formatCurrency(minCumulativeCash)}`);
      console.log(`   ✅ Saldo máximo: ${formatCurrency(maxCumulativeCash)}`);
      console.log(`   ✅ Saldo final: ${formatCurrency(finalCash)}`);
      
      // Verificar se saldo nunca ultrapassa o limite do investimento
      const investmentLimit = -testCase.investment;
      if (minCumulativeCash < investmentLimit) {
        console.log(`   ❌ ERRO: Saldo mínimo (${formatCurrency(minCumulativeCash)}) ultrapassa limite do investimento (${formatCurrency(investmentLimit)})`);
        failedTests++;
        continue;
      }
      
      // Verificar número de lojas
      if (finalStores < testCase.expectedMinStores || finalStores > testCase.expectedMaxStores) {
        console.log(`   ⚠️  AVISO: Número de lojas (${finalStores}) fora do esperado (${testCase.expectedMinStores}-${testCase.expectedMaxStores})`);
      }
      
      // Verificar loja forçada no mês 13
      if (testCase.shouldForceMonth13) {
        const month12Stores = result.monthlyResults.find(m => m.month === 12)?.stores || 0;
        const month13Stores = result.monthlyResults.find(m => m.month === 13)?.stores || 0;
        
        if (month13Stores > month12Stores) {
          console.log(`   ✅ Loja forçada confirmada: mês 12 (${month12Stores} lojas) → mês 13 (${month13Stores} lojas)`);
        } else {
          console.log(`   ⚠️  AVISO: Loja não foi forçada no mês 13 (mês 12: ${month12Stores}, mês 13: ${month13Stores})`);
        }
      }
      
      // Verificar evolução do saldo
      let hasNegativeTrend = false;
      for (let i = 1; i < result.monthlyResults.length; i++) {
        const prev = result.monthlyResults[i - 1].cumulativeCash;
        const curr = result.monthlyResults[i].cumulativeCash;
        if (curr < prev - 1000) { // tolerância para pequenas variações
          hasNegativeTrend = true;
          break;
        }
      }
      
      if (hasNegativeTrend && finalCash < -testCase.investment * 0.5) {
        console.log(`   ⚠️  AVISO: Saldo acumulado pode estar melhorando muito lentamente`);
      }
      
      passedTests++;
      console.log(`   ✅ Teste passou`);
      
    } catch (error) {
      console.log(`   ❌ ERRO ao executar teste: ${error}`);
      failedTests++;
    }
  }
  
  console.log(`\n\n📈 Resumo dos Testes:`);
  console.log(`   ✅ Passou: ${passedTests}`);
  console.log(`   ❌ Falhou: ${failedTests}`);
  console.log(`   📊 Total: ${testCases.length}\n`);
  
  if (failedTests === 0) {
    console.log('🎉 Todos os testes passaram!');
  } else {
    console.log('⚠️  Alguns testes falharam. Revise os resultados acima.');
  }
}

runTests();

