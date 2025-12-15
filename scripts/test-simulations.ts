import { simulate } from '../src/utils/advancedCalculations';

interface TestCase {
  name: string;
  investimento: number;
  lucroDesejado: number;
  perfilOperacao: 'proprio' | 'terceirizar';
  cenario: 'pessimista' | 'medio' | 'otimista';
  expectedStores?: number;
  expectedFinalCashMin?: number;
  expectedFinalCashMax?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 - Deve forçar loja no mês 13',
    investimento: 55000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 2, // Deve ter 2 lojas (1 inicial + 1 forçada no mês 13)
    expectedFinalCashMin: -55000, // Não pode ultrapassar limite
  },
  {
    name: 'Investimento R$ 69.000 - Deve forçar loja no mês 13',
    investimento: 69000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 2, // Deve ter 2 lojas
    expectedFinalCashMin: -69000,
  },
  {
    name: 'Investimento R$ 70.000 - Não força loja, mas pode adicionar automaticamente',
    investimento: 70000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 1, // Pode ter 1 ou mais dependendo do lucro
    expectedFinalCashMin: -70000,
  },
  {
    name: 'Investimento R$ 120.000 - Pode ter múltiplas lojas',
    investimento: 120000,
    lucroDesejado: 5000,
    perfilOperacao: 'proprio',
    cenario: 'medio',
    expectedStores: 1, // Mínimo 1, pode ter mais
    expectedFinalCashMin: -120000,
  },
  {
    name: 'Investimento R$ 55.000 - Cenário Pessimista',
    investimento: 55000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'pessimista',
    expectedStores: 2,
    expectedFinalCashMin: -55000,
  },
  {
    name: 'Investimento R$ 55.000 - Cenário Otimista',
    investimento: 55000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'otimista',
    expectedStores: 2,
    expectedFinalCashMin: -55000,
  },
];

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function runTests() {
  console.log('🧪 Iniciando testes de simulação...\n');
  console.log('='.repeat(80));

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log(`   Investimento: ${formatCurrency(testCase.investimento)}`);
    console.log(`   Cenário: ${testCase.cenario}`);
    console.log(`   Perfil: ${testCase.perfilOperacao}`);

    try {
      const result = simulate(
        testCase.lucroDesejado,
        testCase.investimento,
        testCase.perfilOperacao,
        60,
        testCase.cenario
      );

      const finalMonth = result.monthlyResults[result.monthlyResults.length - 1];
      const finalStores = finalMonth.stores;
      const finalCash = finalMonth.cumulativeCash;

      console.log(`\n   ✅ Resultados:`);
      console.log(`      - Lojas finais: ${finalStores}`);
      console.log(`      - Saldo final: ${formatCurrency(finalCash)}`);
      console.log(`      - Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
      console.log(`      - ROI mensal: ${result.roi.toFixed(2)}%`);

      // Verificar loja forçada no mês 13 para investimentos < 70k
      if (testCase.investimento < 70000) {
        const month13 = result.monthlyResults.find(m => m.month === 13);
        if (month13) {
          console.log(`      - Mês 13 - Lojas: ${month13.stores}, Saldo: ${formatCurrency(month13.cumulativeCash)}`);
          if (month13.stores < 2) {
            console.log(`      ⚠️  AVISO: Esperava 2 lojas no mês 13, mas encontrou ${month13.stores}`);
          }
        }
      }

      // Validações
      let testPassed = true;
      const errors: string[] = [];

      // Verificar número de lojas
      if (testCase.expectedStores !== undefined) {
        if (finalStores < testCase.expectedStores) {
          errors.push(`Esperava pelo menos ${testCase.expectedStores} loja(s), mas encontrou ${finalStores}`);
          testPassed = false;
        }
      }

      // Verificar saldo mínimo
      if (testCase.expectedFinalCashMin !== undefined) {
        if (finalCash < testCase.expectedFinalCashMin) {
          errors.push(
            `Saldo final (${formatCurrency(finalCash)}) está abaixo do limite mínimo (${formatCurrency(testCase.expectedFinalCashMin)})`
          );
          testPassed = false;
        }
      }

      // Verificar saldo máximo
      if (testCase.expectedFinalCashMax !== undefined) {
        if (finalCash > testCase.expectedFinalCashMax) {
          errors.push(
            `Saldo final (${formatCurrency(finalCash)}) está acima do limite máximo (${formatCurrency(testCase.expectedFinalCashMax)})`
          );
          testPassed = false;
        }
      }

      // Verificar que saldo nunca ultrapassa o investimento inicial
      const minCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      if (minCash < -testCase.investimento) {
        errors.push(
          `Saldo mínimo (${formatCurrency(minCash)}) ultrapassou o limite do investimento inicial (${formatCurrency(-testCase.investimento)})`
        );
        testPassed = false;
      }

      // Verificar que receita só começa no mês 3
      const month1 = result.monthlyResults.find(m => m.month === 1);
      const month2 = result.monthlyResults.find(m => m.month === 2);
      const month3 = result.monthlyResults.find(m => m.month === 3);
      if (month1 && month1.totalRevenue !== 0) {
        errors.push(`Mês 1 não deveria ter receita, mas encontrou ${formatCurrency(month1.totalRevenue)}`);
        testPassed = false;
      }
      if (month2 && month2.totalRevenue !== 0) {
        errors.push(`Mês 2 não deveria ter receita, mas encontrou ${formatCurrency(month2.totalRevenue)}`);
        testPassed = false;
      }

      // Verificar que manutenção e utilities são 0 no mês 1
      if (month1) {
        if (month1.maintenance !== 0) {
          errors.push(`Mês 1 não deveria ter manutenção, mas encontrou ${formatCurrency(month1.maintenance)}`);
          testPassed = false;
        }
        if (month1.utilities !== 0) {
          errors.push(`Mês 1 não deveria ter utilities, mas encontrou ${formatCurrency(month1.utilities)}`);
          testPassed = false;
        }
      }

      if (testPassed) {
        console.log(`\n   ✅ TESTE PASSOU`);
        passed++;
      } else {
        console.log(`\n   ❌ TESTE FALHOU:`);
        errors.forEach(error => console.log(`      - ${error}`));
        failed++;
      }
    } catch (error) {
      console.log(`\n   ❌ ERRO ao executar teste:`);
      console.log(`      ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }

    console.log(`\n${'='.repeat(80)}`);
  }

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

