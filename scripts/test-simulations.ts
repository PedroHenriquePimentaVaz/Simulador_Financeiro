import { simulate } from '../src/utils/advancedCalculations.ts';
import { formatCurrency } from '../src/utils/advancedCalculations.ts';

interface TestCase {
  name: string;
  investimento: number;
  lucroDesejado: number;
  perfilOperacao: 'proprio' | 'terceirizar';
  cenario: 'pessimista' | 'medio' | 'otimista';
}

const testCases: TestCase[] = [
  {
    name: 'Investimento R$ 55.000 (deve forçar loja no mês 13)',
    investimento: 55000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio'
  },
  {
    name: 'Investimento R$ 69.000 (deve forçar loja no mês 13)',
    investimento: 69000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio'
  },
  {
    name: 'Investimento R$ 70.000 (não força, pode adicionar automaticamente)',
    investimento: 70000,
    lucroDesejado: 2000,
    perfilOperacao: 'proprio',
    cenario: 'medio'
  },
  {
    name: 'Investimento R$ 120.000 (pode ter múltiplas lojas)',
    investimento: 120000,
    lucroDesejado: 5000,
    perfilOperacao: 'proprio',
    cenario: 'medio'
  }
];

function runTests() {
  console.log('🧪 Iniciando testes de validação dos cálculos...\n');
  
  let allTestsPassed = true;
  
  for (const testCase of testCases) {
    console.log(`\n📊 Teste: ${testCase.name}`);
    console.log(`   Investimento: ${formatCurrency(testCase.investimento)}`);
    console.log(`   Perfil: ${testCase.perfilOperacao} | Cenário: ${testCase.cenario}\n`);
    
    try {
      const result = simulate(
        testCase.lucroDesejado,
        testCase.investimento,
        testCase.perfilOperacao,
        60,
        testCase.cenario
      );
      
      // Validações
      const errors: string[] = [];
      const warnings: string[] = [];
      
      // 1. Verificar se saldo acumulado nunca ultrapassa o limite do investimento
      const minCumulativeCash = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
      if (minCumulativeCash < -testCase.investimento) {
        errors.push(`❌ Saldo acumulado mínimo (${formatCurrency(minCumulativeCash)}) ultrapassa o investimento inicial (${formatCurrency(-testCase.investimento)})`);
      } else {
        console.log(`   ✅ Saldo acumulado mínimo: ${formatCurrency(minCumulativeCash)} (dentro do limite)`);
      }
      
      // 2. Verificar se loja forçada no mês 13 acontece para investimentos < 70k
      if (testCase.investimento < 70000) {
        const month12 = result.monthlyResults.find(m => m.month === 12);
        const month13 = result.monthlyResults.find(m => m.month === 13);
        const month14 = result.monthlyResults.find(m => m.month === 14);
        
        if (month12 && month13 && month14) {
          const storesAt12 = month12.stores;
          const storesAt13 = month13.stores;
          const storesAt14 = month14.stores;
          
          if (storesAt13 > storesAt12) {
            console.log(`   ✅ Loja forçada no mês 13: ${storesAt12} → ${storesAt13} lojas`);
          } else {
            errors.push(`❌ Loja deveria ser forçada no mês 13, mas lojas permaneceram em ${storesAt12}`);
          }
          
          // Verificar se auto-add funciona após mês 13
          if (storesAt14 > storesAt13) {
            console.log(`   ✅ Auto-add funcionando após mês 13: ${storesAt13} → ${storesAt14} lojas`);
          }
        }
      }
      
      // 3. Verificar se receita começa apenas no mês 3
      const month1 = result.monthlyResults[0];
      const month2 = result.monthlyResults[1];
      const month3 = result.monthlyResults[2];
      
      if (month1.totalRevenue !== 0 || month2.totalRevenue !== 0) {
        errors.push(`❌ Receita deveria ser zero nos meses 1-2, mas mês 1: ${formatCurrency(month1.totalRevenue)}, mês 2: ${formatCurrency(month2.totalRevenue)}`);
      } else {
        console.log(`   ✅ Receita inicia apenas no mês 3: ${formatCurrency(month3.totalRevenue)}`);
      }
      
      // 4. Verificar se primeira loja abre no mês 2
      if (month2.stores !== 1) {
        errors.push(`❌ Primeira loja deveria abrir no mês 2, mas há ${month2.stores} lojas`);
      } else {
        console.log(`   ✅ Primeira loja abre no mês 2`);
      }
      
      // 5. Verificar se CAPEX é descontado corretamente
      const month1Capex = month1.cumulativeCash;
      const month2Capex = month2.cumulativeCash;
      
      // Mês 1: deve ter taxa de franquia (30k)
      // Mês 2: deve ter CAPEX primeira loja (capex + container + geladeira)
      const expectedMonth1 = -30000; // Taxa de franquia
      const expectedMonth2 = expectedMonth1 - (20000 + 1275 + 600); // CAPEX completo primeira loja
      
      if (Math.abs(month1Capex - expectedMonth1) > 1) {
        warnings.push(`⚠️  Mês 1: Saldo esperado ~${formatCurrency(expectedMonth1)}, obtido ${formatCurrency(month1Capex)}`);
      }
      
      if (Math.abs(month2Capex - expectedMonth2) > 1) {
        warnings.push(`⚠️  Mês 2: Saldo esperado ~${formatCurrency(expectedMonth2)}, obtido ${formatCurrency(month2Capex)}`);
      }
      
      // 6. Verificar se lucro líquido é positivo após período inicial
      const last12Months = result.monthlyResults.slice(-12);
      const avgLast12Profit = last12Months.reduce((sum, m) => sum + m.netProfit, 0) / 12;
      
      if (avgLast12Profit <= 0) {
        warnings.push(`⚠️  Lucro líquido médio dos últimos 12 meses é negativo ou zero: ${formatCurrency(avgLast12Profit)}`);
      } else {
        console.log(`   ✅ Lucro líquido médio (últimos 12 meses): ${formatCurrency(avgLast12Profit)}`);
      }
      
      // 7. Verificar número máximo de lojas
      const maxStores = Math.max(...result.monthlyResults.map(m => m.stores));
      if (maxStores > 3) {
        errors.push(`❌ Número máximo de lojas (${maxStores}) excede o limite de 3`);
      } else {
        console.log(`   ✅ Número máximo de lojas: ${maxStores}`);
      }
      
      // 8. Resumo final
      console.log(`\n   📈 Resumo:`);
      console.log(`      - Saldo final: ${formatCurrency(result.finalCash)}`);
      console.log(`      - Payback: ${result.paybackPeriod > 0 ? `Mês ${result.paybackPeriod}` : 'Não alcançado'}`);
      console.log(`      - ROI mensal: ${result.roi.toFixed(2)}%`);
      console.log(`      - Lojas finais: ${result.monthlyResults[result.monthlyResults.length - 1].stores}`);
      
      if (errors.length > 0) {
        console.log(`\n   ❌ ERROS ENCONTRADOS:`);
        errors.forEach(e => console.log(`      ${e}`));
        allTestsPassed = false;
      }
      
      if (warnings.length > 0) {
        console.log(`\n   ⚠️  AVISOS:`);
        warnings.forEach(w => console.log(`      ${w}`));
      }
      
      if (errors.length === 0 && warnings.length === 0) {
        console.log(`\n   ✅ Todos os testes passaram para este cenário!`);
      }
      
    } catch (error) {
      console.error(`   ❌ ERRO ao executar simulação:`, error);
      allTestsPassed = false;
    }
  }
  
  console.log(`\n\n${'='.repeat(60)}`);
  if (allTestsPassed) {
    console.log('✅ TODOS OS TESTES PASSARAM!');
  } else {
    console.log('❌ ALGUNS TESTES FALHARAM. Verifique os erros acima.');
  }
  console.log('='.repeat(60));
}

// Executar testes
runTests();

