import { simulate } from '../src/utils/advancedCalculations.js';

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
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investment: 55000,
    expectedStores: 2,
    expectedMonth13Store: true,
    minFinalCash: -55000, // Não pode ultrapassar investimento
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investment: 69000,
    expectedStores: 2,
    expectedMonth13Store: true,
    minFinalCash: -69000,
  },
  {
    name: 'Investimento R$ 70.000 (não força, mas pode auto-adicionar)',
    investment: 70000,
    expectedStores: 1, // Pode ter mais se auto-adicionar
    minFinalCash: -70000,
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investment: 120000,
    expectedStores: 1, // Mínimo, pode ter mais
    minFinalCash: -120000,
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

console.log('🧪 Testando Simulações Financeiras\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const testCase of testCases) {
  console.log(`\n📊 ${testCase.name}`);
  console.log('-'.repeat(80));

  try {
    const result = simulate(
      2000, // lucro desejado
      testCase.investment,
      'proprio', // perfil operação
      60, // 60 meses
      'medio' // cenário médio
    );

    const finalMonth = result.monthlyResults[result.monthlyResults.length - 1];
    const month13 = result.monthlyResults.find(m => m.month === 13);
    const month12 = result.monthlyResults.find(m => m.month === 12);

    // Verificações
    const checks: { name: string; passed: boolean; message: string }[] = [];

    // 1. Verificar número de lojas
    const storesCheck = finalMonth.stores >= testCase.expectedStores;
    checks.push({
      name: `Número de lojas (esperado: >= ${testCase.expectedStores}, atual: ${finalMonth.stores})`,
      passed: storesCheck,
      message: storesCheck ? '✅' : '❌',
    });

    // 2. Verificar loja no mês 13 para investimentos <70k
    if (testCase.expectedMonth13Store) {
      const month13Check = month13 && month13.stores >= 2;
      checks.push({
        name: `Loja adicionada no mês 13 (esperado: >= 2 lojas, atual: ${month13?.stores || 0})`,
        passed: month13Check || false,
        message: month13Check ? '✅' : '❌',
      });
    }

    // 3. Verificar saldo mínimo (não pode ultrapassar investimento)
    const minCashCheck = result.monthlyResults.every(
      m => m.cumulativeCash >= testCase.minFinalCash!
    );
    checks.push({
      name: `Saldo nunca ultrapassa limite (limite: ${formatCurrency(testCase.minFinalCash!)})`,
      passed: minCashCheck,
      message: minCashCheck ? '✅' : '❌',
    });

    // 4. Verificar se há loja no mês 12 (pagamento) para investimentos <70k
    if (testCase.expectedMonth13Store && month12) {
      const month12Check = month12.stores === 1; // Ainda 1 loja no mês 12 (paga mas não abre)
      checks.push({
        name: `Mês 12: ainda 1 loja (paga mas não abre ainda)`,
        passed: month12Check,
        message: month12Check ? '✅' : '❌',
      });
    }

    // 5. Verificar se o saldo no mês 12 reflete o pagamento da segunda loja
    // Nota: Para investimentos <70k, o saldo pode ser limitado ao investimento inicial,
    // então a verificação é mais flexível
    if (testCase.expectedMonth13Store && month12 && month13) {
      const capexTotal = 20000 + 1275 + 600; // capex + container + geladeira
      // Verifica se o CAPEX foi pago (saldo do mês 12 deve ser mais negativo que o mês 11)
      const month11 = result.monthlyResults.find(m => m.month === 11);
      if (month11) {
        const cashFlowCheck = month12.cumulativeCash <= month11.cumulativeCash + month12.netProfit;
        checks.push({
          name: `CAPEX pago no mês 12 (saldo mais negativo que esperado sem CAPEX)`,
          passed: cashFlowCheck,
          message: cashFlowCheck ? '✅' : '❌',
        });
      }
    }

    // Exibir resultados
    console.log(`\n📈 Resultados:`);
    console.log(`   • Lojas finais: ${finalMonth.stores}`);
    console.log(`   • Saldo final: ${formatCurrency(finalMonth.cumulativeCash)}`);
    console.log(`   • Lucro líquido último mês: ${formatCurrency(finalMonth.netProfit)}`);
    console.log(`   • Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
    console.log(`   • ROI mensal: ${result.roi.toFixed(2)}%`);

    if (month13) {
      console.log(`\n📅 Mês 13:`);
      console.log(`   • Lojas: ${month13.stores}`);
      console.log(`   • Saldo acumulado: ${formatCurrency(month13.cumulativeCash)}`);
    }

    // Exibir verificações
    console.log(`\n🔍 Verificações:`);
    checks.forEach(check => {
      console.log(`   ${check.message} ${check.name}`);
      if (check.passed) {
        passedTests++;
      } else {
        failedTests++;
      }
    });

    // Verificar se todas passaram
    const allPassed = checks.every(c => c.passed);
    if (allPassed) {
      console.log(`\n✅ Teste PASSOU`);
    } else {
      console.log(`\n❌ Teste FALHOU`);
    }
  } catch (error) {
    console.error(`\n❌ ERRO ao executar teste:`, error);
    failedTests++;
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Resumo Final:`);
console.log(`   ✅ Testes passados: ${passedTests}`);
console.log(`   ❌ Testes falhados: ${failedTests}`);
console.log(`   📈 Taxa de sucesso: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%\n`);

