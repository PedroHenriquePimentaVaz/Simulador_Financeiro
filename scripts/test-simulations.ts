import { simulate, formatCurrency } from '../src/utils/advancedCalculations.js';

interface TestCase {
  name: string;
  investimento: number;
  lucroDesejado: number;
  perfilOperacao: 'proprio' | 'terceirizar';
  cenario: 'pessimista' | 'medio' | 'otimista';
  expectedStores?: number;
  expectedMonth13Store?: boolean;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investimento: 55000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 2,
    expectedMonth13Store: true
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investimento: 69000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 2,
    expectedMonth13Store: true
  },
  {
    name: 'Investimento R$ 70.000 (não deve forçar, apenas auto-add)',
    investimento: 70000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 2
  },
  {
    name: 'Investimento R$ 120.000 (auto-add normal)',
    investimento: 120000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 3
  }
];

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
        testCase.lucroDesejado,
        testCase.investimento,
        testCase.perfilOperacao,
        60,
        testCase.cenario
      );

      const finalMonth = result.monthlyResults[result.monthlyResults.length - 1];
      const month13 = result.monthlyResults[12]; // Mês 13 (índice 12)

      console.log(`✅ Investimento: ${formatCurrency(testCase.investimento)}`);
      console.log(`   Cenário: ${testCase.cenario}`);
      console.log(`   Perfil: ${testCase.perfilOperacao}`);
      console.log(`   Lojas finais: ${finalMonth.stores}`);
      console.log(`   Saldo final: ${formatCurrency(result.finalCash)}`);
      console.log(`   Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
      console.log(`   ROI mensal: ${result.roi.toFixed(2)}%`);

      // Verificar número de lojas esperado
      if (testCase.expectedStores) {
        if (finalMonth.stores === testCase.expectedStores) {
          console.log(`   ✅ Número de lojas correto: ${finalMonth.stores}`);
        } else {
          console.log(`   ❌ Número de lojas incorreto: esperado ${testCase.expectedStores}, obtido ${finalMonth.stores}`);
          failed++;
          continue;
        }
      }

      // Verificar se loja foi adicionada no mês 13 para investimentos < 70k
      if (testCase.expectedMonth13Store) {
        const month12 = result.monthlyResults[11]; // Mês 12 (índice 11)
        const month13Stores = month13.stores;
        const month12Stores = month12.stores;

        if (month13Stores > month12Stores) {
          console.log(`   ✅ Loja adicionada no mês 13: ${month12Stores} → ${month13Stores}`);
        } else {
          console.log(`   ❌ Loja NÃO foi adicionada no mês 13: ${month12Stores} → ${month13Stores}`);
          failed++;
          continue;
        }
      }

      // Verificar se saldo nunca ultrapassa o investimento inicial
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      if (minCash >= -testCase.investimento) {
        console.log(`   ✅ Saldo mínimo respeitado: ${formatCurrency(minCash)} (limite: ${formatCurrency(-testCase.investimento)})`);
      } else {
        console.log(`   ❌ Saldo mínimo violado: ${formatCurrency(minCash)} (limite: ${formatCurrency(-testCase.investimento)})`);
        failed++;
        continue;
      }

      // Verificar se receita começa apenas no mês 3
      const month1 = result.monthlyResults[0];
      const month2 = result.monthlyResults[1];
      const month3 = result.monthlyResults[2];

      if (month1.totalRevenue === 0 && month2.totalRevenue === 0 && month3.totalRevenue > 0) {
        console.log(`   ✅ Receita inicia corretamente no mês 3`);
      } else {
        console.log(`   ⚠️  Receita: Mês 1=${formatCurrency(month1.totalRevenue)}, Mês 2=${formatCurrency(month2.totalRevenue)}, Mês 3=${formatCurrency(month3.totalRevenue)}`);
      }

      // Verificar se manutenção e utilities são 0 no mês 1
      if (month1.maintenance === 0 && month1.utilities === 0) {
        console.log(`   ✅ Manutenção e utilities zerados no mês 1`);
      } else {
        console.log(`   ⚠️  Manutenção/Utilities mês 1: ${formatCurrency(month1.maintenance)} / ${formatCurrency(month1.utilities)}`);
      }

      passed++;
      console.log(`   ✅ Teste PASSOU`);

    } catch (error) {
      console.error(`   ❌ Erro ao executar teste:`, error);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`\n📈 Resumo dos Testes:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📊 Total: ${testCases.length}\n`);

  if (failed === 0) {
    console.log('🎉 Todos os testes passaram!\n');
    process.exit(0);
  } else {
    console.log('⚠️  Alguns testes falharam. Revise os resultados acima.\n');
    process.exit(1);
  }
}

runTests();

