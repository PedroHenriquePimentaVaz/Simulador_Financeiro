import { simulate } from '../src/utils/advancedCalculations.ts';

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedMonth13Store: boolean | undefined; // true = deve ter, false = não deve ter, undefined = não importa
  scenario?: 'pessimista' | 'medio' | 'otimista';
  operationProfile?: 'proprio' | 'terceirizar';
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2, // Deve ter pelo menos 2 lojas (1 inicial + 1 forçada no mês 13)
    expectedMonth13Store: true // Deve ter loja no mês 13
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2, // Deve ter pelo menos 2 lojas
    expectedMonth13Store: true // Deve ter loja no mês 13
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode adicionar automaticamente)',
    investment: 70000,
    expectedStores: 1, // Pode ter mais se auto-add funcionar
    expectedMonth13Store: undefined // Pode ter loja no mês 13 se auto-add funcionar (não é erro)
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 1, // Base, pode ter mais
    expectedMonth13Store: undefined // Pode ter loja no mês 13 se auto-add funcionar (não é erro)
  }
];

function runTests() {
  console.log('🧪 Iniciando testes de simulação...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log(`   Investimento: R$ ${testCase.investment.toLocaleString('pt-BR')}`);
    
    try {
      const result = simulate(
        2000, // lucroDesejado
        testCase.investment,
        testCase.operationProfile || 'proprio',
        60, // 60 meses
        testCase.scenario || 'medio'
      );
      
      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      const month13Stores = result.monthlyResults[12]?.stores || 0; // Mês 13 (índice 12)
      const finalCash = result.finalCash;
      const payback = result.paybackPeriod;
      
      console.log(`   ✅ Lojas finais: ${finalStores} (esperado: >= ${testCase.expectedStores})`);
      console.log(`   ✅ Lojas no mês 13: ${month13Stores}`);
      console.log(`   ✅ Saldo final: R$ ${finalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      console.log(`   ✅ Payback: ${payback > 0 ? payback + ' meses' : 'Não alcançado'}`);
      
      // Validações
      let testPassed = true;
      
      if (finalStores < testCase.expectedStores) {
        console.log(`   ❌ ERRO: Esperava pelo menos ${testCase.expectedStores} lojas, mas tem apenas ${finalStores}`);
        testPassed = false;
      }
      
      if (testCase.expectedMonth13Store === true && month13Stores < 2) {
        console.log(`   ❌ ERRO: Esperava loja adicional no mês 13, mas tem apenas ${month13Stores} loja(s)`);
        testPassed = false;
      }
      
      if (testCase.expectedMonth13Store === false && month13Stores >= 2) {
        console.log(`   ❌ ERRO: Não esperava loja adicional no mês 13, mas tem ${month13Stores} loja(s)`);
        testPassed = false;
      }
      
      // Verificar se saldo nunca ultrapassa o limite do investimento
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      if (minCash < -testCase.investment) {
        console.log(`   ❌ ERRO: Saldo acumulado mínimo (${minCash.toLocaleString('pt-BR')}) ultrapassou o limite do investimento (-${testCase.investment.toLocaleString('pt-BR')})`);
        testPassed = false;
      } else {
        console.log(`   ✅ Saldo mínimo respeitou limite: R$ ${minCash.toLocaleString('pt-BR')} >= -R$ ${testCase.investment.toLocaleString('pt-BR')}`);
      }
      
      // Verificar se receita está sendo calculada corretamente (não deve ser zero após mês 2)
      const month3Revenue = result.monthlyResults[2]?.totalRevenue || 0;
      if (month3Revenue === 0) {
        console.log(`   ⚠️  AVISO: Receita no mês 3 é zero (pode ser esperado se ainda não há lojas operando)`);
      } else {
        console.log(`   ✅ Receita no mês 3: R$ ${month3Revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
      }
      
      if (testPassed) {
        console.log(`   ✅ TESTE PASSOU`);
        passed++;
      } else {
        console.log(`   ❌ TESTE FALHOU`);
        failed++;
      }
      
    } catch (error) {
      console.log(`   ❌ ERRO ao executar simulação: ${error}`);
      failed++;
    }
  }
  
  console.log(`\n\n📈 Resumo dos Testes:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📊 Total: ${testCases.length}`);
  
  if (failed === 0) {
    console.log(`\n🎉 Todos os testes passaram!`);
    process.exit(0);
  } else {
    console.log(`\n⚠️  Alguns testes falharam. Revise os resultados acima.`);
    process.exit(1);
  }
}

runTests();

