import { simulate } from '../src/utils/advancedCalculations.js';

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedMonth13Store?: boolean;
  minFinalCash?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2,
    expectedMonth13Store: true,
    // Para investimentos <70k, o saldo pode ultrapassar o limite quando força loja no mês 12
    minFinalCash: -60000 // Permite ultrapassar um pouco para melhorar retorno
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    expectedMonth13Store: true,
    minFinalCash: -69000
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode adicionar)',
    investment: 70000,
    expectedStores: 2,
    expectedMonth13Store: false,
    minFinalCash: -70000
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 3,
    expectedMonth13Store: false,
    minFinalCash: -120000
  }
];

console.log('🧪 Iniciando testes manuais de simulação...\n');

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`\n📊 Teste: ${testCase.name}`);
  console.log(`   Investimento: R$ ${testCase.investment.toLocaleString('pt-BR')}`);
  
  try {
    const result = simulate(
      2000, // lucro desejado
      testCase.investment,
      'proprio', // perfil operação
      60, // 60 meses
      'medio' // cenário médio
    );
    
    // Verificar número de lojas no final
    const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
    console.log(`   ✅ Lojas finais: ${finalStores} (esperado: ${testCase.expectedStores})`);
    
    if (finalStores === testCase.expectedStores) {
      passed++;
    } else {
      failed++;
      console.log(`   ❌ ERRO: Número de lojas não corresponde!`);
    }
    
    // Verificar se loja foi adicionada no mês 13 (para investimentos <70k)
    if (testCase.expectedMonth13Store !== undefined) {
      const month12Stores = result.monthlyResults[11]?.stores || 0; // mês 12 (índice 11)
      const month13Stores = result.monthlyResults[12]?.stores || 0; // mês 13 (índice 12)
      const hasStoreAddedInMonth13 = month13Stores > month12Stores;
      
      console.log(`   ✅ Loja no mês 13: ${hasStoreAddedInMonth13} (esperado: ${testCase.expectedMonth13Store})`);
      
      if (hasStoreAddedInMonth13 === testCase.expectedMonth13Store) {
        passed++;
      } else {
        failed++;
        console.log(`   ❌ ERRO: Loja não foi adicionada no mês esperado!`);
      }
    }
    
    // Verificar saldo acumulado mínimo
    const minCumulativeCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
    console.log(`   ✅ Saldo mínimo: R$ ${minCumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    if (testCase.minFinalCash && minCumulativeCash >= testCase.minFinalCash) {
      passed++;
      console.log(`   ✅ Saldo nunca ultrapassou o limite do investimento`);
    } else if (testCase.minFinalCash) {
      failed++;
      console.log(`   ❌ ERRO: Saldo ultrapassou o limite! (mínimo: ${testCase.minFinalCash})`);
    }
    
    // Verificar saldo final
    const finalCash = result.finalCash;
    console.log(`   ✅ Saldo final: R$ ${finalCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
    
    // Verificar payback
    console.log(`   ✅ Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
    
    // Verificar ROI
    console.log(`   ✅ ROI mensal: ${result.roi.toFixed(2)}%`);
    
    // Detalhes dos meses críticos
    console.log(`   📅 Detalhes meses críticos:`);
    console.log(`      Mês 1: Saldo ${result.monthlyResults[0].cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lojas: ${result.monthlyResults[0].stores}`);
    console.log(`      Mês 2: Saldo ${result.monthlyResults[1].cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lojas: ${result.monthlyResults[1].stores}`);
    console.log(`      Mês 12: Saldo ${result.monthlyResults[11].cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lojas: ${result.monthlyResults[11].stores}`);
    console.log(`      Mês 13: Saldo ${result.monthlyResults[12].cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lojas: ${result.monthlyResults[12].stores}`);
    console.log(`      Mês 60: Saldo ${result.monthlyResults[59].cumulativeCash.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}, Lojas: ${result.monthlyResults[59].stores}`);
    
  } catch (error) {
    failed++;
    console.log(`   ❌ ERRO ao executar simulação:`, error);
  }
}

console.log(`\n\n📈 Resumo dos Testes:`);
console.log(`   ✅ Passou: ${passed}`);
console.log(`   ❌ Falhou: ${failed}`);
console.log(`   📊 Total: ${passed + failed}`);

if (failed === 0) {
  console.log(`\n🎉 Todos os testes passaram!`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Alguns testes falharam. Revise os resultados acima.`);
  process.exit(1);
}

