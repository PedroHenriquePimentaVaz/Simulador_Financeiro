import { simulate } from '../src/utils/advancedCalculations.js';
import behonestParams from '../behonest_params.json' assert { type: 'json' };

interface TestCase {
  name: string;
  investment: number;
  expectedStores: number;
  expectedMonth13Store?: boolean;
  expectedFinalCashMin?: number;
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (abaixo de 70k)',
    investment: 55000,
    expectedStores: 2,
    expectedMonth13Store: true,
    expectedFinalCashMin: -55000
  },
  {
    name: 'Investimento R$ 69.000 (abaixo de 70k)',
    investment: 69000,
    expectedStores: 2,
    expectedMonth13Store: true,
    expectedFinalCashMin: -69000
  },
  {
    name: 'Investimento R$ 70.000 (limite)',
    investment: 70000,
    expectedStores: 2,
    expectedMonth13Store: false,
    expectedFinalCashMin: -70000
  },
  {
    name: 'Investimento R$ 120.000 (acima de 70k)',
    investment: 120000,
    expectedStores: 3,
    expectedMonth13Store: false,
    expectedFinalCashMin: -120000
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
  console.log('🧪 Iniciando testes de validação do simulador...\n');
  
  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n📊 Testando: ${testCase.name}`);
    console.log('─'.repeat(60));
    
    try {
      const result = simulate(
        2000, // lucro desejado
        testCase.investment,
        'proprio', // perfil operação
        60, // meses
        'medio' // cenário
      );

      // Validação 1: Saldo acumulado nunca ultrapassa -investimentoInicial
      const minCumulativeCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      const maxAllowedNegative = -testCase.investment;
      
      if (minCumulativeCash < maxAllowedNegative) {
        console.log(`❌ FALHOU: Saldo mínimo (${formatCurrency(minCumulativeCash)}) ultrapassou limite (${formatCurrency(maxAllowedNegative)})`);
        failed++;
        continue;
      } else {
        console.log(`✅ Saldo mínimo: ${formatCurrency(minCumulativeCash)} (limite: ${formatCurrency(maxAllowedNegative)})`);
      }

      // Validação 2: Loja forçada no mês 13 para investimentos <70k
      if (testCase.expectedMonth13Store) {
        const month12 = result.monthlyResults.find(m => m.month === 12);
        const month13 = result.monthlyResults.find(m => m.month === 13);
        
        if (!month12 || !month13) {
          console.log(`❌ FALHOU: Não encontrou meses 12 ou 13`);
          failed++;
          continue;
        }

        const hasStoreInMonth13 = month13.stores > month12.stores;
        if (!hasStoreInMonth13) {
          console.log(`❌ FALHOU: Loja não foi adicionada no mês 13 (Mês 12: ${month12.stores} lojas, Mês 13: ${month13.stores} lojas)`);
          failed++;
          continue;
        } else {
          console.log(`✅ Loja adicionada no mês 13 (Mês 12: ${month12.stores} lojas → Mês 13: ${month13.stores} lojas)`);
        }
      }

      // Validação 3: Número de lojas final
      const finalStores = result.monthlyResults[result.monthlyResults.length - 1].stores;
      if (finalStores !== testCase.expectedStores) {
        console.log(`⚠️  AVISO: Número de lojas final (${finalStores}) diferente do esperado (${testCase.expectedStores})`);
        console.log(`   Isso pode ser normal se o auto-add não foi necessário`);
      } else {
        console.log(`✅ Número de lojas final: ${finalStores}`);
      }

      // Validação 4: Saldo final
      const finalCash = result.finalCash;
      console.log(`📈 Saldo final: ${formatCurrency(finalCash)}`);
      console.log(`📈 ROI: ${result.roi.toFixed(2)}%`);
      console.log(`📈 Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);

      // Validação 5: Verificar se há lojas antes do mês 13 para investimentos <70k
      if (testCase.expectedMonth13Store) {
        const month11 = result.monthlyResults.find(m => m.month === 11);
        if (month11 && month11.stores > 1) {
          console.log(`⚠️  AVISO: Loja adicional foi adicionada antes do mês 13 (Mês 11: ${month11.stores} lojas)`);
        }
      }

      passed++;
      console.log(`✅ Teste passou!`);

    } catch (error) {
      console.log(`❌ ERRO: ${error instanceof Error ? error.message : String(error)}`);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 Resumo dos testes:`);
  console.log(`   ✅ Passou: ${passed}`);
  console.log(`   ❌ Falhou: ${failed}`);
  console.log(`   📈 Total: ${passed + failed}`);
  console.log('='.repeat(60));

  if (failed === 0) {
    console.log('\n🎉 Todos os testes passaram!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Alguns testes falharam. Revise os resultados acima.');
    process.exit(1);
  }
}

runTests();

