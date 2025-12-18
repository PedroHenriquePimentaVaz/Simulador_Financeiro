import behonestParams from '../../behonest_params.json';

export interface BeHonestParams {
  simples_rate_m2: number;
  cmv_rate: number;
  loss_rate: number;
  reposicao_rate: number;
  royalties_rate: number;
  other_repasses_rate: number;
  card_fee_rate: number;
  marketing_rate: number;
  system_fee_per_store: number;
  accounting_fixed: number;
  franchise_fee: number;
  capex_per_store: number;
  rev_per_store_m2: number;
  rev_growth_factor: number;
  stores_timeline: number[];
  amlabs_per_store: number;
  container_per_store: number;
  refrigerator_per_store: number;
  maintenance_fixed: number;
  utilities_fixed: number;
  cooperativa_per_store: number;
  funcionario_cost: number;
  transporte_reembolso: number;
}

export interface MonthlyResult {
  month: number;
  stores: number;
  revenuePerStore: number;
  totalRevenue: number;
  tax: number;
  netRevenue: number;
  cmv: number;
  losses: number;
  grossProfit: number;
  reposicao: number;
  royalties: number;
  otherRepasses: number;
  cardFee: number;
  marketing: number;
  systemFee: number;
  amlabs: number;
  container: number;
  refrigerator: number;
  maintenance: number;
  utilities: number;
  cooperativa: number;
  funcionario: number;
  transporte: number;
  fixedCosts: number;
  accounting: number;
  operatingProfit: number;
  netProfit: number;
  cashFlow: number;
  cumulativeCash: number;
}

export interface AdvancedSimulationResult {
  monthlyResults: MonthlyResult[];
  totalInvestment: number;
  paybackPeriod: number;
  roi: number;
  finalCash: number;
  cenario: 'pessimista' | 'medio' | 'otimista';
  perfilOperacao: 'integral' | 'gestao' | 'terceirizar' | 'proprio';
}

export function validateFormData(lucroDesejado: number, investimentoInicial: number): boolean {
  const params = behonestParams as BeHonestParams;
  
  // Validações básicas
  const minLucro = 1000;
  const maxLucro = 15000;
  const minInvestimento = params.franchise_fee + params.capex_per_store; // Taxa franquia (30k) + primeira loja (20k)
  const maxInvestimento = 500000;
  
  // Verificar se está dentro dos limites básicos
  if (lucroDesejado < minLucro || lucroDesejado > maxLucro || 
      investimentoInicial < minInvestimento || investimentoInicial > maxInvestimento) {
    return false;
  }
  
  // Simular cenário atual
  const result = simulate(lucroDesejado, investimentoInicial, 'proprio', 24);
  
  // Verificar se em algum momento alcança a renda mensal desejada
  const reachesDesiredIncome = result.monthlyResults.some(month => 
    month.netProfit >= lucroDesejado
  );
  
  // Verificar se o prejuízo nunca ultrapassa o investimento inicial
  const maxLoss = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
  const lossWithinLimits = Math.abs(maxLoss) <= investimentoInicial;
  
  return reachesDesiredIncome && lossWithinLimits;
}

// Funções auxiliares para obter valores baseados no cenário
function getRevenuePerStore(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 10000; // Baixo
    case 'medio': return 15000; // Médio
    case 'otimista': return 20000; // Alto
  }
}

function getCapexPerStore(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 20000; // Mantém patamar base de implementação
    case 'medio': return 20000; // Médio
    case 'otimista': return 30000; // Alto
  }
}

function getGrowthFactor(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 1.005; // 0,5% ao mês
    case 'medio': return 1.01; // 1% ao mês
    case 'otimista': return 1.015; // 1,5% ao mês
  }
}

function getLossRate(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 0.06; // Alto: 6% (cenário pessimista tem mais perdas)
    case 'medio': return 0.04; // Médio: 4%
    case 'otimista': return 0.02; // Baixo: 2% (cenário otimista tem menos perdas)
  }
}

function getCmvRate(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 0.62; // Baixo: 38% margem = 62% CMV
    case 'medio': return 0.60; // Médio: 40% margem = 60% CMV
    case 'otimista': return 0.58; // Alto: 42% margem = 58% CMV
  }
}

function getRepasseRate(cenario: 'pessimista' | 'medio' | 'otimista'): number {
  switch(cenario) {
    case 'pessimista': return 0.05; // Alto: 5% (cenário pessimista tem mais repasse)
    case 'medio': return 0.035; // Médio: 3,5%
    case 'otimista': return 0.02; // Baixo: 2% (cenário otimista tem menos repasse)
  }
}

export function simulate(
  _lucroDesejado: number,
  investimentoInicial: number,
  perfilOperacao: string,
  months: number = 60,
  cenario: 'pessimista' | 'medio' | 'otimista' = 'medio'
): AdvancedSimulationResult {
  const params = behonestParams as BeHonestParams;
  
  // Lógica: valor base sempre médio, depois aplica ajustes INDEPENDENTES e ADITIVOS
  // Perfil de operação:
  //   - 0-2h: -7,5%
  //   - 2-4h: 0%
  //   - Mais de 4h: +7,5%
  // Cenário:
  //   - Pessimista: -7,5%
  //   - Médio: 0%
  //   - Otimista: +7,5%
  
  // Determinar ajuste baseado em cenário e perfil (são independentes e aditivos)
  let adjustment = 0;
  
  // Ajuste do perfil de operação
  if (perfilOperacao === 'integral') {
    adjustment -= 0.075; // 0-2h: -7,5%
  } else if (perfilOperacao === 'terceirizar') {
    adjustment += 0.075; // Mais de 4h: +7,5%
  }
  // gestao (2-4h) não altera nada (0%)
  
  // Ajuste do cenário
  if (cenario === 'pessimista') {
    adjustment -= 0.075; // -7,5%
  } else if (cenario === 'otimista') {
    adjustment += 0.075; // +7,5%
  }
  // medio não altera nada (0%)
  
  // Sempre usar cenário médio como base
  const baseCenario: 'pessimista' | 'medio' | 'otimista' = 'medio';
  let revenuePerStore = getRevenuePerStore(baseCenario);
  const capexPerStore = getCapexPerStore(baseCenario);
  const growthFactor = getGrowthFactor(baseCenario);
  const lossRate = getLossRate(baseCenario);
  const cmvRate = getCmvRate(baseCenario);
  const repasseRate = getRepasseRate(baseCenario);
  
  // Aplicar ajuste na receita
  revenuePerStore = revenuePerStore * (1 + adjustment);
  
  // Calcular capacidade de lojas baseado no investimento
  const capexTotalPorLoja = capexPerStore + params.container_per_store + params.refrigerator_per_store;
  const franchiseFee = params.franchise_fee;
  const firstStoreCost = capexTotalPorLoja;
  
  // Para investimentos >= 110k, calcular quantas lojas cabem; para menores, limite de 2 extras
  let maxAdditionalStores = 2; // Limite padrão (total máximo 3 lojas)
  if (investimentoInicial >= 110000) {
    const availableForStores = investimentoInicial - franchiseFee - firstStoreCost;
    const maxStoresByInvestment = Math.floor(availableForStores / capexTotalPorLoja);
    maxAdditionalStores = Math.max(2, maxStoresByInvestment); // Mínimo 2, máximo baseado no investimento
  }

  // Melhor renda fixa: SELIC (~15% a.a. efetivo) - atualizado 2025
  // Nota: Este valor deve ser atualizado periodicamente conforme mudanças na taxa SELIC
  const bestFixedAnnualRate = 0.15; // 15% a.a. efetivo (SELIC)
  const bestFixedValue = investimentoInicial * Math.pow(1 + bestFixedAnnualRate / 12, months);

  const runSimulation = (targetAdditionalStores: number): AdvancedSimulationResult => {
    const capexTotalPorLoja = capexPerStore + params.container_per_store + params.refrigerator_per_store;
    const openSchedule: number[] = []; // meses em que novas lojas abrem (além da primeira)
    let paidAdditional = 0;
    const forceEarlyStoreUnder70k = investimentoInicial < 70000;
    let lastStoreImplementationMonth = 2; // Mês 2 é quando a primeira loja é implementada
  
  // Os custos de operação (cooperativa, funcionário, transporte) são calculados diretamente baseado no perfil
  
  const monthlyResults: MonthlyResult[] = [];
  let cumulativeCash = 0; // Começa com saldo zero
  let totalInvestment = investimentoInicial;
  
  for (let month = 1; month <= months; month++) {
    // Calcular quantas lojas estão operando no mês atual
    let currentStores = 0;
    if (month >= 2) {
      currentStores = 1; // primeira loja
        const openedAdditionals = openSchedule.filter(openMonth => month >= openMonth).length;
        currentStores += openedAdditionals;
    }
    
    // Período de implementação: primeiros 2 meses sem receita
    let totalRevenue = 0;
    let revenuePerStoreValue = 0;
    if (month > 2 && currentStores > 0) {
      // Calcular receita com crescimento mensal (começando do mês 3)
      const monthsSinceStart = month - 3; // Meses desde o início da operação
      const cappedMonths = Math.min(monthsSinceStart, 6); // crescimento apenas até o 6º mês
      revenuePerStoreValue = revenuePerStore * Math.pow(growthFactor, cappedMonths);
      totalRevenue = revenuePerStoreValue * currentStores;
    }
    
    // Imposto Simples
    const tax = totalRevenue * params.simples_rate_m2;
    const netRevenue = totalRevenue - tax;
    
    // CMV (Custo da Mercadoria Vendida) - calculado sobre receita líquida
    const cmv = netRevenue * cmvRate;
    
    // Perdas - calculado sobre receita líquida
    const losses = netRevenue * lossRate;
    
    // Lucro Bruto
    const grossProfit = netRevenue - cmv - losses;
    
    // Despesas operacionais
    const reposicao = totalRevenue * params.reposicao_rate;
    const royalties = totalRevenue * params.royalties_rate;
    const otherRepasses = totalRevenue * repasseRate;
    const cardFee = totalRevenue * params.card_fee_rate;
    const marketing = totalRevenue * params.marketing_rate;
    const systemFee = 0; // Sistema descontinuado
    const amlabs = currentStores * params.amlabs_per_store;
    // Container e Geladeira são custos únicos (CAPEX), não mensais
    const maintenance = month === 1 ? 0 : params.maintenance_fixed;
    const utilities = month === 1 ? 0 : params.utilities_fixed;
    const accounting = params.accounting_fixed;
    
    // Custos de operação baseados no perfil e número de lojas
    // Todos os perfis são operação própria (sem cooperativa, apenas transporte)
    // 'terceirizar' (mais de 4h) não significa terceirização, mas sim mais dedicação = cenário otimista
    let cooperativa = 0;
    let funcionario = 0;
    let transporte = 0;
    
    if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao' || perfilOperacao === 'terceirizar') {
      // Operação própria: até 15 lojas apenas reembolso de transporte
      if (currentStores <= 15) {
        transporte = params.transporte_reembolso * currentStores;
      } else {
        // Acima de 15 lojas: reembolso de transporte + funcionários (1 a cada 15 lojas)
        transporte = params.transporte_reembolso * currentStores;
        const funcionariosNecessarios = Math.floor((currentStores - 15) / 15) + 1;
        funcionario = funcionariosNecessarios * params.funcionario_cost;
      }
    }
    
    // Custos fixos mensais (sem multiplicador, pois já aplicamos os custos específicos acima)
    const fixedCosts = amlabs + maintenance + utilities + accounting + cooperativa + funcionario + transporte;
    
    // Lucro Operacional (não duplicar dedução de systemFee e accounting, pois já estão em fixedCosts)
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
    
    // Lucro Líquido (assumindo sem impostos adicionais)
    const netProfit = operatingProfit;
    
    // Fluxo de caixa com pagamentos escalonados
    let cashFlow = netProfit;
    
    // Pagamentos escalonados do investimento inicial
    let containerCapex = 0;
    let refrigeratorCapex = 0;
    
    if (month === 1) {
      cashFlow -= params.franchise_fee; // Mês 1: paga taxa de franquia (30k)
    } else if (month === 2) {
      // Mês 2: paga implementação primeira loja (capex + container + geladeira)
      containerCapex = params.container_per_store;
      refrigeratorCapex = params.refrigerator_per_store;
      const firstStoreCapex = capexPerStore + containerCapex + refrigeratorCapex;
      cashFlow -= firstStoreCapex;
    }

    // Reinvestir/comprar novas lojas assim que possível, respeitando limite de lojas e intervalo mínimo de 2 meses
    if (month < months) {
      let availableCash = cumulativeCash + cashFlow;
      const minMonthsBetweenStores = 2; // Intervalo mínimo de 2 meses entre implementações

      // Caso especial: para investimentos abaixo de 70k, força compra no mês 12 e abertura no mês 13 (se houver caixa dentro do limite do investimento)
      const shouldForceAtMonth12 = forceEarlyStoreUnder70k && month === 12 && paidAdditional < targetAdditionalStores;
      if (shouldForceAtMonth12 && availableCash - capexTotalPorLoja >= -investimentoInicial) {
        // Verificar intervalo mínimo (mês 12 - mês 2 = 10 meses, então está OK)
        availableCash -= capexTotalPorLoja;
        paidAdditional += 1;
        openSchedule.push(13); // abre no mês 13
        containerCapex += params.container_per_store;
        refrigeratorCapex += params.refrigerator_per_store;
        cashFlow -= capexTotalPorLoja;
        lastStoreImplementationMonth = month; // Atualizar último mês de implementação
      }

      // Fora do caso especial, segue a lógica normal de adicionar lojas.
      // Para investimentos <70k, só libera auto-add a partir do mês 13 (depois da loja forçada).
      if (!forceEarlyStoreUnder70k || month >= 13) {
        // Verificar se já se passaram pelo menos 2 meses desde a última implementação
        const monthsSinceLastImplementation = month - lastStoreImplementationMonth;
        const canAddStoreNow = monthsSinceLastImplementation >= minMonthsBetweenStores;
        
        if (canAddStoreNow) {
          while (
            paidAdditional < targetAdditionalStores &&
            availableCash - capexTotalPorLoja >= -investimentoInicial
          ) {
            availableCash -= capexTotalPorLoja;
            paidAdditional += 1;
            openSchedule.push(month + 1); // abre no mês seguinte ao pagamento
            containerCapex += params.container_per_store;
            refrigeratorCapex += params.refrigerator_per_store;
            cashFlow -= capexTotalPorLoja;
            lastStoreImplementationMonth = month; // Atualizar último mês de implementação
            // Após adicionar uma loja, sair do loop para garantir intervalo mínimo
            break;
          }
        }
      }
    }
    
    // Custos fixos já estão incluídos no netProfit (via fixedCosts deduzidos em operatingProfit)
    // Não precisamos deduzi-los novamente aqui
    
    // Garantir que o saldo não ultrapasse o limite do investimento inicial
    if (cumulativeCash + cashFlow < -investimentoInicial) {
      cashFlow = -investimentoInicial - cumulativeCash;
    }
    
    cumulativeCash += cashFlow;
    
    monthlyResults.push({
      month,
      stores: currentStores,
      revenuePerStore: revenuePerStoreValue,
      totalRevenue,
      tax,
      netRevenue,
      cmv,
      losses,
      grossProfit,
      reposicao,
      royalties,
      otherRepasses,
      cardFee,
      marketing,
      systemFee,
      amlabs,
      container: containerCapex, // Container é CAPEX por loja, registrado quando uma loja é adicionada
      refrigerator: refrigeratorCapex, // Geladeira é CAPEX por loja, registrado quando uma loja é adicionada
      maintenance,
      utilities,
      cooperativa,
      funcionario,
      transporte,
      fixedCosts,
      accounting,
      operatingProfit,
      netProfit,
      cashFlow,
      cumulativeCash
    });
  }
  
    // Calcular payback
    let paybackPeriod = 0;
    for (let i = 0; i < monthlyResults.length; i++) {
      if (monthlyResults[i].cumulativeCash >= 0) {
        paybackPeriod = i + 1;
        break;
      }
    }
    
    // Calcular Rentabilidade Anual (CAGR - Compound Annual Growth Rate)
    const finalCash = monthlyResults[monthlyResults.length - 1].cumulativeCash;
    
    // Valor final total = investimento inicial + saldo final acumulado
    const finalValue = totalInvestment + finalCash;
    // CAGR = [(Valor Final / Valor Inicial)^(1/n) - 1] × 100
    // onde n = número de anos (5 anos)
    const years = 5;
    const annualRentability = (Math.pow(finalValue / totalInvestment, 1 / years) - 1) * 100;
    
    return {
      monthlyResults,
      totalInvestment,
      paybackPeriod,
      roi: annualRentability, // Rentabilidade anual média (% ao ano)
      finalCash,
      cenario,
      perfilOperacao: perfilOperacao as 'integral' | 'gestao' | 'terceirizar' | 'proprio'
    };
  };

  // Para investimentos >= 110k, usar o limite calculado; para menores, limitar a 9 para evitar valores irreais
  const maxAutoAdditional = investimentoInicial >= 110000 
    ? maxAdditionalStores 
    : Math.min(maxAdditionalStores, 9);

  // Testar incrementalmente e parar assim que superar renda fixa
  // Para investimentos >= 110k, continuar adicionando até superar renda fixa ou atingir o limite
  let chosen = runSimulation(0);
  if (investimentoInicial >= 110000) {
    // Para investimentos grandes, testar todas as possibilidades até superar renda fixa
    for (let n = 1; n <= maxAutoAdditional; n++) {
      const candidate = runSimulation(n);
      if (candidate.finalCash >= bestFixedValue) {
        chosen = candidate;
        break;
      }
      // Continua com o melhor resultado até agora
      if (candidate.finalCash > chosen.finalCash) {
        chosen = candidate;
      }
    }
  } else {
    // Para investimentos menores, manter lógica original
    for (let n = 1; n <= maxAutoAdditional && chosen.finalCash < bestFixedValue; n++) {
      const candidate = runSimulation(n);
      chosen = candidate;
      if (candidate.finalCash >= bestFixedValue) break;
    }
  }

  return chosen;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Interface para análise de viabilidade
export interface ViabilityAnalysis {
  isViable: boolean;
  score: number; // 0-95 (máximo 95% de certeza)
  message: string;
  recommendations: string[];
  expectedMonthsToTarget: number | null;
  maxRealisticMonthlyIncome: number;
}

// Função para analisar a viabilidade do investimento (versão simplificada para o formulário)
export function analyzeInvestmentViability(
  investimentoInicial: number,
  lucroDesejado: number,
  perfilOperacao: string,
  cenario: 'pessimista' | 'medio' | 'otimista' = 'medio'
): ViabilityAnalysis {
  const params = behonestParams as BeHonestParams;
  const recommendations: string[] = [];
  let score = 100;
  let isViable = true;
  let message = '';
  let expectedMonthsToTarget: number | null = null;
  let maxRealisticMonthlyIncome = 0;

  // Lógica: valor base sempre médio, depois aplica ajustes INDEPENDENTES e ADITIVOS
  // Perfil de operação:
  //   - 0-2h: -7,5%
  //   - 2-4h: 0%
  //   - Mais de 4h: +7,5%
  // Cenário:
  //   - Pessimista: -7,5%
  //   - Médio: 0%
  //   - Otimista: +7,5%
  
  // Determinar ajuste baseado em cenário e perfil (são independentes e aditivos)
  let adjustment = 0;
  
  // Ajuste do perfil de operação
  if (perfilOperacao === 'integral') {
    adjustment -= 0.075; // 0-2h: -7,5%
  } else if (perfilOperacao === 'terceirizar') {
    adjustment += 0.075; // Mais de 4h: +7,5%
  }
  // gestao (2-4h) não altera nada (0%)
  
  // Ajuste do cenário
  if (cenario === 'pessimista') {
    adjustment -= 0.075; // -7,5%
  } else if (cenario === 'otimista') {
    adjustment += 0.075; // +7,5%
  }
  // medio não altera nada (0%)
  
  // Sempre usar cenário médio como base
  const baseCenario: 'pessimista' | 'medio' | 'otimista' = 'medio';
  const capexPerStore = getCapexPerStore(baseCenario) + params.container_per_store + params.refrigerator_per_store;
  let revenuePerStore = getRevenuePerStore(baseCenario);
  const lossRate = getLossRate(baseCenario);
  const cmvRate = getCmvRate(baseCenario);
  
  // Aplicar ajuste na receita
  revenuePerStore = revenuePerStore * (1 + adjustment);
  
  // Calcular quantas lojas iniciais o investimento permite (usando CAPEX do próprio cenário)
  const franchiseFee = params.franchise_fee; // Taxa de franquia
  const baseStores = 1; // Sempre começa com 1 loja
  
  // Usar o CAPEX do cenário selecionado para calcular número de lojas
  let availableForStores = investimentoInicial - franchiseFee - capexPerStore;
  let additionalStores = Math.floor(availableForStores / capexPerStore);
  let totalStores = baseStores + additionalStores;

  // Verificar se o investimento é suficiente para a taxa básica + primeira loja
  const minInvestment = franchiseFee + capexPerStore;
  if (investimentoInicial < minInvestment) {
    isViable = false;
    score = 0;
    message = `Investimento insuficiente. Mínimo necessário: R$ ${minInvestment.toLocaleString('pt-BR')} (taxa de franquia + primeira loja).`;
    recommendations.push(`Aumente o investimento para pelo menos R$ ${minInvestment.toLocaleString('pt-BR')}`);
    return { isViable, score, message, recommendations, expectedMonthsToTarget, maxRealisticMonthlyIncome };
  }

  // Calcular estimativa de lucro mensal por loja baseado no cenário
  // Receita - Imposto - CMV - Perdas - Custos fixos aproximados
  const revenuePerMonth = revenuePerStore;
  const tax = revenuePerMonth * params.simples_rate_m2;
  const netRevenue = revenuePerMonth - tax;
  const cmv = netRevenue * cmvRate;
  const losses = netRevenue * lossRate;
  const grossProfit = netRevenue - cmv - losses;
  
  // Custos fixos aproximados por loja (sem cooperativa/funcionário/transporte que variam)
  const fixedCostsPerStore = params.system_fee_per_store + params.amlabs_per_store;
  const repasseRate = getRepasseRate(baseCenario); // Usar repasse baseado no cenário médio
  
  // Calcular outros custos sobre a receita total (como na função simulate)
  const reposicao = revenuePerMonth * params.reposicao_rate;
  const royalties = revenuePerMonth * params.royalties_rate;
  const otherRepasses = revenuePerMonth * repasseRate;
  const cardFee = revenuePerMonth * params.card_fee_rate;
  const marketing = revenuePerMonth * params.marketing_rate;
  const otherCosts = reposicao + royalties + otherRepasses + cardFee + marketing;
  
  // Ajustar custos baseado no perfil de operação
  // Todos os perfis são operação própria (sem cooperativa, apenas transporte)
  // 'terceirizar' (mais de 4h) não significa terceirização, mas sim mais dedicação = cenário otimista
  let additionalCostsPerStore = 0;
  if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao' || perfilOperacao === 'terceirizar') {
    // Operação própria: apenas transporte (sem cooperativa)
    if (totalStores > 15) {
      additionalCostsPerStore = (params.funcionario_cost * Math.floor((totalStores - 15) / 15) + 1) / totalStores;
    }
    additionalCostsPerStore += params.transporte_reembolso;
  }
  
  const estimatedMonthlyProfitPerStore = Math.max(0, grossProfit - otherCosts - fixedCostsPerStore - additionalCostsPerStore - (params.maintenance_fixed + params.utilities_fixed + params.accounting_fixed) / totalStores);
  
  maxRealisticMonthlyIncome = totalStores * estimatedMonthlyProfitPerStore;

  // Análise de viabilidade baseada no lucro desejado
  if (lucroDesejado > maxRealisticMonthlyIncome * 1.5) {
    score -= 40;
    isViable = false;
    message = `Meta de lucro mensal muito alta para o investimento.`;
    recommendations.push(`Com R$ ${investimentoInicial.toLocaleString('pt-BR')}, o lucro mensal realista é até R$ ${Math.round(maxRealisticMonthlyIncome * 1.2).toLocaleString('pt-BR')}`);
    recommendations.push(`Considere aumentar o investimento ou reduzir a meta de lucro mensal`);
  } else if (lucroDesejado > maxRealisticMonthlyIncome) {
    score -= 20;
    message = `Meta de lucro mensal alta, mas possível com expansão futura.`;
    recommendations.push(`Você precisará adicionar mais lojas para alcançar essa meta`);
    
    // Calcular quantas lojas adicionais são necessárias
    const additionalStoresNeeded = Math.ceil((lucroDesejado - maxRealisticMonthlyIncome) / estimatedMonthlyProfitPerStore);
    const additionalInvestmentNeeded = additionalStoresNeeded * capexPerStore;
    
    recommendations.push(`Investimento adicional necessário: R$ ${additionalInvestmentNeeded.toLocaleString('pt-BR')} para ${additionalStoresNeeded} lojas`);
  } else {
    message = `Meta de lucro mensal realista e alcançável!`;
    recommendations.push(`Com ${totalStores} lojas, você pode alcançar sua meta`);
  }

  // Análise do perfil de operação
  if (perfilOperacao === 'terceirizar') {
    score += 5;
    recommendations.push(`Maior dedicação (mais de 4h) maximiza o potencial de crescimento`);
  } else if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao') {
    score += 5;
    recommendations.push(`Operação própria maximiza o potencial de crescimento`);
  }
  
  // Análise do ajuste aplicado (sem adicionar recomendação)
  if (adjustment > 0) {
    score += 10;
  } else if (adjustment < 0) {
    score -= 10;
  }

  // Limitar score máximo a 95
  score = Math.min(score, 95);

  return {
    isViable,
    score,
    message,
    recommendations,
    expectedMonthsToTarget,
    maxRealisticMonthlyIncome
  };
}

// Função para analisar a viabilidade do investimento com resultados mensais (versão completa)
export function analyzeInvestmentViabilityWithResults(
  investimentoInicial: number,
  lucroDesejado: number,
  perfilOperacao: string,
  monthlyResults: MonthlyResult[]
): ViabilityAnalysis {
  const params = behonestParams as BeHonestParams;
  const recommendations: string[] = [];
  let score = 100;
  let isViable = true;
  let message = '';
  let expectedMonthsToTarget: number | null = null;
  let maxRealisticMonthlyIncome = 0;

  // Calcular quantas lojas iniciais o investimento permite
  const franchiseFee = params.franchise_fee; // Taxa de franquia
  const capexPerStore = params.capex_per_store + params.container_per_store + params.refrigerator_per_store; // CAPEX por loja (inclui container e geladeira)
  const baseStores = 1; // Sempre começa com 1 loja
  
  let availableForStores = investimentoInicial - franchiseFee - capexPerStore; // Desconta taxa + primeira loja
  let additionalStores = Math.floor(availableForStores / capexPerStore);
  let totalStores = baseStores + additionalStores;

  // Verificar se o investimento é suficiente para a taxa básica + primeira loja
  const minInvestment = franchiseFee + capexPerStore;
  if (investimentoInicial < minInvestment) {
    isViable = false;
    score = 0;
    message = `Investimento insuficiente. Mínimo necessário: R$ ${minInvestment.toLocaleString('pt-BR')} (taxa de franquia + primeira loja).`;
    recommendations.push(`Aumente o investimento para pelo menos R$ ${minInvestment.toLocaleString('pt-BR')}`);
    return { isViable, score, message, recommendations, expectedMonthsToTarget, maxRealisticMonthlyIncome };
  }

  // Calcular médias reais dos 60 meses da simulação
  const totalNetProfit = monthlyResults.reduce((sum: number, result: MonthlyResult) => sum + result.netProfit, 0);
  const totalStoresMonths = monthlyResults.reduce((sum: number, result: MonthlyResult) => sum + result.stores, 0);
  
  // Calcular médias mensais reais
  const averageMonthlyNetProfitPerStore = totalStoresMonths > 0 ? totalNetProfit / totalStoresMonths : 0;
  const averageMonthlyNetProfit = totalNetProfit / monthlyResults.length; // Média geral dos 60 meses
  
  // Usar a média real dos 60 meses como lucro mensal realista
  maxRealisticMonthlyIncome = averageMonthlyNetProfit;

  // Análise de viabilidade baseada no lucro desejado
  if (lucroDesejado > averageMonthlyNetProfit * 1.5) {
    score -= 40;
    isViable = false;
    message = `Meta de lucro mensal muito alta para o investimento.`;
    recommendations.push(`Com R$ ${investimentoInicial.toLocaleString('pt-BR')}, o lucro mensal realista é até R$ ${Math.round(averageMonthlyNetProfit * 1.2).toLocaleString('pt-BR')}`);
    recommendations.push(`Considere aumentar o investimento ou reduzir a meta de lucro mensal`);
  } else if (lucroDesejado > averageMonthlyNetProfit) {
    score -= 20;
    message = `Meta de lucro mensal alta, mas possível com expansão futura.`;
    recommendations.push(`Você precisará adicionar mais lojas para alcançar essa meta`);
    
    // Calcular quantas lojas adicionais são necessárias
    const additionalStoresNeeded = Math.ceil((lucroDesejado - averageMonthlyNetProfit) / averageMonthlyNetProfitPerStore);
    const additionalInvestmentNeeded = additionalStoresNeeded * capexPerStore;
    
    recommendations.push(`Necessário: ${additionalStoresNeeded} lojas adicionais (R$ ${additionalInvestmentNeeded.toLocaleString('pt-BR')})`);
    
    // Estimar tempo para alcançar a meta
    const monthsToSave = Math.ceil(additionalInvestmentNeeded / averageMonthlyNetProfit);
    expectedMonthsToTarget = monthsToSave + 2; // +2 meses para implementação
    recommendations.push(`Tempo estimado para alcançar a meta: ${expectedMonthsToTarget} meses`);
  } else if (lucroDesejado >= averageMonthlyNetProfit * 0.7) {
    score += 10;
    message = `Meta de lucro mensal realista e alcançável.`;
    recommendations.push(`Excelente! Sua meta está alinhada com o potencial do investimento`);
    recommendations.push(`Com ${totalStores} loja(s), você pode ter uma renda mensal de até R$ ${Math.round(averageMonthlyNetProfit).toLocaleString('pt-BR')}`);
    expectedMonthsToTarget = 1; // Meta alcançável desde o início
  } else {
    // Meta extremamente baixa - penaliza severamente
    score -= 40;
    message = `Meta de lucro mensal extremamente baixa para o investimento.`;
    recommendations.push(`Sua meta está muito abaixo do potencial do investimento`);
    recommendations.push(`Com ${totalStores} loja(s), você pode ter uma renda mensal muito maior`);
    recommendations.push(`Considere uma meta mais ambiciosa para justificar o investimento`);
    expectedMonthsToTarget = 1; // Meta alcançável desde o início
  }

  // Análise do perfil de operação
  if (perfilOperacao === 'terceirizar') {
    score += 5;
    recommendations.push(`Maior dedicação (mais de 4h) maximiza o potencial de crescimento`);
  } else if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao') {
    score += 5;
    recommendations.push(`Operação própria maximiza o potencial de crescimento`);
  }

  // Análise da relação investimento/lucro
  const roiRatio = (lucroDesejado * 12) / investimentoInicial;
  const maxRealisticROI = (maxRealisticMonthlyIncome * 12) / investimentoInicial;
  
  // Só mostra ROI se for realista (até 150% do potencial máximo)
  if (roiRatio <= maxRealisticROI * 1.5) {
    if (roiRatio > 0.3) { // Mais de 30% ao ano
      score += 10;
      recommendations.push(`Excelente potencial de ROI: ${(roiRatio * 100).toFixed(1)}% ao ano`);
    } else if (roiRatio > 0.2) { // Entre 20-30% ao ano
      recommendations.push(`Bom potencial de ROI: ${(roiRatio * 100).toFixed(1)}% ao ano`);
    } else if (roiRatio < 0.1) { // Menos de 10% ao ano
      // Penaliza severamente ROI muito baixo
      score -= 30;
      recommendations.push(`ROI muito baixo: ${(roiRatio * 100).toFixed(1)}% ao ano`);
      recommendations.push(`Este investimento não é recomendado com essa meta de lucro`);
      recommendations.push(`Considere uma meta mais ambiciosa ou um investimento menor`);
    }
  } else {
    // ROI irrealista - não mostra nada sobre ROI, apenas penaliza
    score -= 30;
  }

  // Definir mensagem final
  if (score >= 80) {
    message = `✅ Investimento altamente viável! ${message}`;
  } else if (score >= 60) {
    message = `⚠️ Investimento viável com ressalvas. ${message}`;
  } else if (score >= 40) {
    message = `❌ Investimento de alto risco. ${message}`;
  } else {
    message = `🚫 Investimento não recomendado. ${message}`;
  }

  // Limitar score máximo a 95
  score = Math.min(score, 95);

  return {
    isViable,
    score,
    message,
    recommendations,
    expectedMonthsToTarget,
    maxRealisticMonthlyIncome
  };
}

// Função para verificar se pode adicionar uma loja em um mês específico
export function canAddStore(
  monthlyResults: MonthlyResult[], 
  month: number, 
  totalInvestment: number
): boolean {
  const params = behonestParams as BeHonestParams;
  const capexTotalPorLoja = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
  const minMonthsBetweenStores = 2; // Intervalo mínimo de 2 meses entre implementações

  // Não pode adicionar nos meses 1, 2 (período de implementação) ou 3 (primeira loja começando)
  if (month < 4 || month > monthlyResults.length) {
    return false;
  }
  
  const currentMonthResult = monthlyResults[month - 1];
  
  // Pode adicionar se, após pagar o CAPEX completo, o saldo não ultrapassar o limite do investimento (ex.: 55k → pode quando chegar a -35k)
  const minimumCumulativeCash = -(totalInvestment - capexTotalPorLoja);
  if (currentMonthResult.cumulativeCash < minimumCumulativeCash) {
    return false;
  }
  
  // Verificar intervalo mínimo de 2 meses desde a última implementação
  // A primeira loja é implementada no mês 2
  let lastImplementationMonth = 2;
  
  // Procurar por implementações anteriores (verificando quando o número de lojas aumentou)
  for (let i = 2; i < month - 1; i++) {
    const prevResult = monthlyResults[i - 1];
    const currentResult = monthlyResults[i];
    // Se o número de lojas aumentou ou há CAPEX (container ou refrigerator), houve uma implementação
    if (currentResult.stores > prevResult.stores || 
        currentResult.container > 0 || 
        currentResult.refrigerator > 0) {
      lastImplementationMonth = i + 1; // +1 porque o índice do array é month - 1
    }
  }
  
  const monthsSinceLastImplementation = month - lastImplementationMonth;
  return monthsSinceLastImplementation >= minMonthsBetweenStores;
}

// Função para adicionar uma loja a partir de um mês específico
export function addStoreToSimulation(
  simulationResult: AdvancedSimulationResult, 
  monthToAdd: number
): AdvancedSimulationResult {
  const { monthlyResults, totalInvestment, cenario, perfilOperacao } = simulationResult;
  
  if (!canAddStore(monthlyResults, monthToAdd, totalInvestment)) {
    // Verificar qual é o motivo da falha
    const params = behonestParams as BeHonestParams;
    const capexTotalPorLoja = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
    const currentMonthResult = monthlyResults[monthToAdd - 1];
    const minimumCumulativeCash = -(totalInvestment - capexTotalPorLoja);
    const minMonthsBetweenStores = 2;
    
    let lastImplementationMonth = 2;
    for (let i = 2; i < monthToAdd - 1; i++) {
      const prevResult = monthlyResults[i - 1];
      const currentResult = monthlyResults[i];
      if (currentResult.stores > prevResult.stores || 
          currentResult.container > 0 || 
          currentResult.refrigerator > 0) {
        lastImplementationMonth = i + 1;
      }
    }
    const monthsSinceLastImplementation = monthToAdd - lastImplementationMonth;
    
    if (currentMonthResult.cumulativeCash < minimumCumulativeCash) {
      throw new Error('Não é possível adicionar uma loja neste mês. Ainda não há lucro acumulado suficiente.');
    } else if (monthsSinceLastImplementation < minMonthsBetweenStores) {
      throw new Error(`Não é possível adicionar uma loja neste mês. É necessário aguardar pelo menos ${minMonthsBetweenStores} meses entre implementações. Última implementação foi no mês ${lastImplementationMonth}.`);
    } else {
      throw new Error('Não é possível adicionar uma loja neste mês.');
    }
  }
  
  // Lógica: valor base sempre médio, depois aplica ajustes INDEPENDENTES e ADITIVOS
  // Determinar ajuste baseado em cenário e perfil (são independentes e aditivos)
  let adjustment = 0;
  
  // Ajuste do perfil de operação
  if (perfilOperacao === 'integral') {
    adjustment -= 0.075; // 0-2h: -7,5%
  } else if (perfilOperacao === 'terceirizar') {
    adjustment += 0.075; // Mais de 4h: +7,5%
  }
  
  // Ajuste do cenário
  if (cenario === 'pessimista') {
    adjustment -= 0.075; // -7,5%
  } else if (cenario === 'otimista') {
    adjustment += 0.075; // +7,5%
  }
  
  // Sempre usar cenário médio como base
  const baseCenario: 'pessimista' | 'medio' | 'otimista' = 'medio';
  let baseRevenuePerStore = getRevenuePerStore(baseCenario);
  const capexPerStore = getCapexPerStore(baseCenario);
  const growthFactor = getGrowthFactor(baseCenario);
  const lossRate = getLossRate(baseCenario);
  const cmvRate = getCmvRate(baseCenario);
  const repasseRate = getRepasseRate(baseCenario);
  
  // Aplicar ajuste na receita
  baseRevenuePerStore = baseRevenuePerStore * (1 + adjustment);
  
  // O investimento total não muda, pois a nova loja é paga com o lucro acumulado
  const newTotalInvestment = totalInvestment;
  const newMonthlyResults = [...monthlyResults];
  const params = behonestParams as BeHonestParams;
  
  // A partir do mês escolhido, recalcular com uma loja a mais
  for (let i = monthToAdd - 1; i < newMonthlyResults.length; i++) {
    const currentResult = newMonthlyResults[i];
    const previousResult = i > 0 ? newMonthlyResults[i - 1] : null;
    const month = currentResult.month;
    
    // Recalcular com +1 loja
    const newStores = currentResult.stores + 1;
    const isImplementationMonth = i === monthToAdd - 1;
    const operatingStores = isImplementationMonth ? currentResult.stores : newStores;
    
    // Recalcular receita considerando período de implementação, crescimento e cenário
    let totalRevenue = 0;
    let revenuePerStoreValue = 0;

    const existingStores = currentResult.stores;
    const existingRevenuePerStore = existingStores > 0
      ? currentResult.totalRevenue / existingStores
      : 0;

    // Receita das lojas existentes (mantém crescimento padrão)
    const monthsSinceStartExisting = month > 3 ? month - 3 : 0;
    const cappedExistingMonths = Math.min(monthsSinceStartExisting, 6); // crescimento trava após 6 meses
    const existingRevenuePerStoreGrown = existingRevenuePerStore * Math.pow(growthFactor, cappedExistingMonths);
    let revenueExisting = existingRevenuePerStoreGrown * existingStores;

    // Receita da nova loja (sem receita no mês de implementação; rampa nos 2 primeiros meses operando)
    const monthsSinceNewStoreStart = month - (monthToAdd); // mês de operação é monthToAdd (implementação foi monthToAdd-1)
    let revenueNewStore = 0;
    if (monthsSinceNewStoreStart >= 1) {
      const cappedNewStoreMonths = Math.min(Math.max(monthsSinceNewStoreStart - 1, 0), 6);
      const growthNewStore = Math.pow(growthFactor, cappedNewStoreMonths);
      const baseNewStore = baseRevenuePerStore * growthNewStore;
      const ramp =
        monthsSinceNewStoreStart === 1 ? 0.7 :
        monthsSinceNewStoreStart === 2 ? 0.85 : 1;
      revenueNewStore = baseNewStore * ramp;
    }

    totalRevenue = revenueExisting + revenueNewStore;
    revenuePerStoreValue = newStores > 0 ? totalRevenue / newStores : 0;
    
    // Recalcular todas as variáveis com a nova receita
    const tax = totalRevenue * params.simples_rate_m2;
    const netRevenue = totalRevenue - tax;
    const cmv = netRevenue * cmvRate;
    const losses = netRevenue * lossRate;
    const grossProfit = netRevenue - cmv - losses;
    const reposicao = totalRevenue * params.reposicao_rate;
    const royalties = totalRevenue * params.royalties_rate;
    const otherRepasses = totalRevenue * repasseRate;
    const cardFee = totalRevenue * params.card_fee_rate;
    const marketing = totalRevenue * params.marketing_rate;
    const systemFee = 0; // Sistema descontinuado
    const amlabs = operatingStores * params.amlabs_per_store;
    // Container e Geladeira são CAPEX, não custos mensais
    const maintenance = params.maintenance_fixed;
    const utilities = params.utilities_fixed;
    const accounting = params.accounting_fixed;
    
    // Custos de operação baseados no perfil e número de lojas
    let cooperativa = 0;
    let funcionario = 0;
    let transporte = 0;
    
    if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao' || perfilOperacao === 'terceirizar') {
      if (operatingStores <= 15) {
        transporte = params.transporte_reembolso * operatingStores;
      } else {
        transporte = params.transporte_reembolso * operatingStores;
        const funcionariosNecessarios = Math.floor((operatingStores - 15) / 15) + 1;
        funcionario = funcionariosNecessarios * params.funcionario_cost;
      }
    }
    
    const fixedCosts = amlabs + maintenance + utilities + accounting + cooperativa + funcionario + transporte;
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
    const netProfit = operatingProfit;
    
    // Calcular fluxo de caixa
    let cashFlow = netProfit;
    
    // Se for o mês em que a loja é adicionada, subtrair CAPEX completo (capex + container + geladeira)
    let containerCapex = 0;
    let refrigeratorCapex = 0;
    if (i === monthToAdd - 1) {
      containerCapex = params.container_per_store;
      refrigeratorCapex = params.refrigerator_per_store;
      const additionalStoreCapex = capexPerStore + containerCapex + refrigeratorCapex;
      cashFlow -= additionalStoreCapex;
    }
    
    const cumulativeCash = previousResult ? previousResult.cumulativeCash + cashFlow : cashFlow;
    
    newMonthlyResults[i] = {
      month: currentResult.month,
      stores: newStores,
      totalRevenue,
      revenuePerStore: revenuePerStoreValue,
      tax,
      netRevenue: totalRevenue - tax,
      cmv,
      losses,
      grossProfit,
      reposicao,
      royalties,
      otherRepasses,
      cardFee,
      marketing,
      systemFee,
      amlabs,
      container: containerCapex, // Container é CAPEX por loja, registrado quando uma loja é adicionada
      refrigerator: refrigeratorCapex, // Geladeira é CAPEX por loja, registrado quando uma loja é adicionada
      maintenance,
      utilities,
      cooperativa,
      funcionario,
      transporte,
      fixedCosts,
      accounting,
      operatingProfit,
      netProfit,
      cashFlow,
      cumulativeCash
    };
  }
  
  // Recalcular payback e ROI
  let paybackPeriod = 0;
  for (let i = 0; i < newMonthlyResults.length; i++) {
    if (newMonthlyResults[i].cumulativeCash >= 0) {
      paybackPeriod = i + 1;
      break;
    }
  }
  
  const finalCash = newMonthlyResults[newMonthlyResults.length - 1].cumulativeCash;
  
  // Calcular Rentabilidade Anual (CAGR - Compound Annual Growth Rate)
  const finalValue = newTotalInvestment + finalCash;
  const years = 5;
  const annualRentability = (Math.pow(finalValue / newTotalInvestment, 1 / years) - 1) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi: annualRentability,
    finalCash,
    cenario,
    perfilOperacao
  };
}

export function removeStoreFromSimulation(results: AdvancedSimulationResult, monthToRemove: number): AdvancedSimulationResult {
  const params = behonestParams as BeHonestParams;
  const { cenario, perfilOperacao } = results;
  
  // Lógica: valor base sempre médio, depois aplica ajustes INDEPENDENTES e ADITIVOS
  // Determinar ajuste baseado em cenário e perfil (são independentes e aditivos)
  let adjustment = 0;
  
  // Ajuste do perfil de operação
  if (perfilOperacao === 'integral') {
    adjustment -= 0.075; // 0-2h: -7,5%
  } else if (perfilOperacao === 'terceirizar') {
    adjustment += 0.075; // Mais de 4h: +7,5%
  }
  
  // Ajuste do cenário
  if (cenario === 'pessimista') {
    adjustment -= 0.075; // -7,5%
  } else if (cenario === 'otimista') {
    adjustment += 0.075; // +7,5%
  }
  
  // Sempre usar cenário médio como base
  const baseCenario: 'pessimista' | 'medio' | 'otimista' = 'medio';
  let revenuePerStore = getRevenuePerStore(baseCenario);
  const growthFactor = getGrowthFactor(baseCenario);
  const lossRate = getLossRate(baseCenario);
  const cmvRate = getCmvRate(baseCenario);
  const repasseRate = getRepasseRate(baseCenario);
  
  // Aplicar ajuste na receita
  revenuePerStore = revenuePerStore * (1 + adjustment);
  
  // Verificar se é possível remover a loja
  if (monthToRemove < 4) {
    throw new Error('Não é possível remover lojas dos primeiros 3 meses');
  }
  
  // Encontrar o mês onde a loja foi adicionada (mês anterior ao mês de implementação)
  // const storeAddedMonth = monthToRemove - 1;
  
  // Verificar se existe uma loja para remover neste mês
  const monthResult = results.monthlyResults.find(r => r.month === monthToRemove);
  if (!monthResult || monthResult.stores <= 1) {
    throw new Error('Não há lojas adicionais para remover neste mês');
  }
  
  // Criar nova simulação sem a loja adicional
  const newMonthlyResults = results.monthlyResults.map(result => {
    if (result.month >= monthToRemove) {
      // Reduzir número de lojas a partir do mês de implementação
      const newStores = Math.max(1, result.stores - 1); // Mínimo 1 loja (primeira)
      
      // Recalcular receita considerando crescimento
      let totalRevenue = 0;
      let revenuePerStoreValue = 0;
      if (result.month > 2 && newStores > 0) {
        const monthsSinceStart = result.month - 3;
        const cappedMonths = Math.min(monthsSinceStart, 6); // crescimento apenas até o 6º mês
        revenuePerStoreValue = revenuePerStore * Math.pow(growthFactor, cappedMonths);
        totalRevenue = revenuePerStoreValue * newStores;
      } else {
        totalRevenue = result.totalRevenue;
        revenuePerStoreValue = result.revenuePerStore;
      }
      
      // Recalcular todos os valores baseados na nova receita
      const tax = totalRevenue * params.simples_rate_m2;
      const netRevenue = totalRevenue - tax;
      const cmv = netRevenue * cmvRate;
      const losses = netRevenue * lossRate;
      const grossProfit = netRevenue - cmv - losses;
      const reposicao = totalRevenue * params.reposicao_rate;
      const royalties = totalRevenue * params.royalties_rate;
      const otherRepasses = totalRevenue * repasseRate;
      const cardFee = totalRevenue * params.card_fee_rate;
      const marketing = totalRevenue * params.marketing_rate;
      const systemFee = 0; // Sistema descontinuado
      const amlabs = params.amlabs_per_store * newStores;
      // Container e Geladeira são CAPEX, não custos mensais
      const maintenance = params.maintenance_fixed;
      const utilities = params.utilities_fixed;
      const accounting = params.accounting_fixed;
      
      // Custos de operação baseados no perfil e número de lojas
      let cooperativa = 0;
      let funcionario = 0;
      let transporte = 0;
      
      if (perfilOperacao === 'proprio' || perfilOperacao === 'integral' || perfilOperacao === 'gestao' || perfilOperacao === 'terceirizar') {
        if (newStores <= 15) {
          transporte = params.transporte_reembolso * newStores;
        } else {
          transporte = params.transporte_reembolso * newStores;
          const funcionariosNecessarios = Math.floor((newStores - 15) / 15) + 1;
          funcionario = funcionariosNecessarios * params.funcionario_cost;
        }
      }
      
      const fixedCosts = amlabs + maintenance + utilities + accounting + cooperativa + funcionario + transporte;
      
      const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
      const netProfit = operatingProfit;
      
      // Recalcular fluxo de caixa
      let cashFlow = netProfit;
      
      const cumulativeCash = result.month === 1 ? cashFlow : 
        results.monthlyResults[result.month - 2].cumulativeCash + cashFlow;
      
      return {
        ...result,
        stores: newStores,
        revenuePerStore: revenuePerStoreValue,
        totalRevenue,
        tax,
        netRevenue,
        cmv,
        losses,
        grossProfit,
        reposicao,
        royalties,
        otherRepasses,
        cardFee,
        marketing,
        systemFee,
        amlabs,
        container: 0, // Container é CAPEX, não custo mensal
        refrigerator: 0, // Geladeira é CAPEX, não custo mensal
        maintenance,
        utilities,
        cooperativa,
        funcionario,
        transporte,
        fixedCosts,
        accounting,
        operatingProfit,
        netProfit,
        cashFlow,
        cumulativeCash
      };
    }
    return result;
  });
  
  // Recalcular investimento total
  const newTotalInvestment = results.totalInvestment;
  
  // Recalcular payback e ROI
  let paybackPeriod = 0;
  for (let i = 0; i < newMonthlyResults.length; i++) {
    if (newMonthlyResults[i].cumulativeCash >= 0) {
      paybackPeriod = i + 1;
      break;
    }
  }
  
  const finalCash = newMonthlyResults[newMonthlyResults.length - 1].cumulativeCash;
  
  // Calcular Rentabilidade Anual (CAGR - Compound Annual Growth Rate)
  const finalValue = newTotalInvestment + finalCash;
  const years = 5;
  const annualRentability = (Math.pow(finalValue / newTotalInvestment, 1 / years) - 1) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi: annualRentability,
    finalCash,
    cenario,
    perfilOperacao
  };
}
