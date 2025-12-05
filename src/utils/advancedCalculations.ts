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
  cenario?: 'pessimista' | 'medio' | 'otimista';
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
  const result = simulate(lucroDesejado, investimentoInicial, 'gestao', 24);
  
  // Verificar se em algum momento alcança a renda mensal desejada
  const reachesDesiredIncome = result.monthlyResults.some(month => 
    month.netProfit >= lucroDesejado
  );
  
  // Verificar se o prejuízo nunca ultrapassa o investimento inicial
  const maxLoss = Math.min(...result.monthlyResults.map(m => m.cumulativeCash));
  const lossWithinLimits = Math.abs(maxLoss) <= investimentoInicial;
  
  return reachesDesiredIncome && lossWithinLimits;
}

export function simulate(
  _lucroDesejado: number,
  investimentoInicial: number,
  perfilOperacao: string,
  months: number = 60,
  cenario: 'pessimista' | 'medio' | 'otimista' = 'medio'
): AdvancedSimulationResult {
  const params = behonestParams as BeHonestParams;
  
  // Calcular multiplicador do cenário
  let cenarioMultiplier = 1;
  switch(cenario) {
    case 'pessimista':
      cenarioMultiplier = 0.85; // 15% abaixo da média
      break;
    case 'medio':
      cenarioMultiplier = 1.0; // Média
      break;
    case 'otimista':
      cenarioMultiplier = 1.15; // 15% acima da média
      break;
  }
  
  // Calcular número de lojas baseado no investimento
  // Taxa de franquia (30k) + primeira loja (20k + container + geladeira) + lojas adicionais (mesmo valor cada)
  const baseStores = 1; // Sempre começa com 1 loja
  const firstStoreTotalCapex = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
  const availableForAdditionalStores = investimentoInicial - params.franchise_fee - firstStoreTotalCapex;
  const additionalStores = Math.floor(availableForAdditionalStores / firstStoreTotalCapex);
  const stores = baseStores + additionalStores;
  
  // Ajustar custos fixos baseado no perfil de operação
  let fixedCostsMultiplier = 1;
  switch(perfilOperacao) {
    case 'integral':
      fixedCostsMultiplier = 0.7;
      break;
    case 'gestao':
      fixedCostsMultiplier = 1;
      break;
    case 'terceirizar':
      fixedCostsMultiplier = 1.5;
      break;
  }
  
  const monthlyResults: MonthlyResult[] = [];
  let cumulativeCash = 0; // Começa com saldo zero
  let totalInvestment = investimentoInicial;
  
  for (let month = 1; month <= months; month++) {
    // Calcular quantas lojas estão operando no mês atual
    // Mês 1: 0 lojas (paga taxa de franquia)
    // Mês 2: 1 loja (paga implementação) - período implementação  
    // Mês 3+: 1 loja operando com receita
    // Se tem investimento para mais lojas, elas começam no mesmo mês do pagamento
    let currentStores = 0;
    if (month >= 2) {
      // Primeira loja existe desde o mês 2 (após pagar implementação)
      currentStores = 1;
      
      // Lojas adicionais: começa a operar a partir do mês 7, depois a cada 3 meses
      // Lojas são pagas nos meses 6, 9, 12 e começam a operar nos meses 7, 10, 13
      if (stores > 1 && month >= 7) {
        const monthsSinceM7 = month - 6; // Meses desde o mês 7
        // Calcula quantas lojas já estão operando (uma a cada 3 meses)
        const storesOperating = Math.ceil(monthsSinceM7 / 3);
        const maxAdditionalStores = Math.min(additionalStores, storesOperating);
        currentStores = 1 + maxAdditionalStores;
      }
    }
    
    // Período de implementação: primeiros 2 meses sem receita
    let totalRevenue = 0;
    let revenuePerStore = 0;
    if (month > 2 && currentStores > 0) {
      // Calcular receita com crescimento mensal (começando do mês 3) e aplicar multiplicador do cenário
      const baseRevenuePerStore = params.rev_per_store_m2;
      const growthFactor = Math.pow(params.rev_growth_factor, month - 3); // Ajustar para começar do mês 3
      revenuePerStore = baseRevenuePerStore * growthFactor * cenarioMultiplier;
      totalRevenue = revenuePerStore * currentStores;
    }
    
    // Imposto Simples
    const tax = totalRevenue * params.simples_rate_m2;
    const netRevenue = totalRevenue - tax;
    
    // CMV (Custo da Mercadoria Vendida) - calculado sobre receita líquida
    const cmv = netRevenue * params.cmv_rate;
    
    // Perdas - calculado sobre receita líquida
    const losses = netRevenue * params.loss_rate;
    
    // Lucro Bruto
    const grossProfit = netRevenue - cmv - losses;
    
    // Despesas operacionais
    const reposicao = totalRevenue * params.reposicao_rate;
    const royalties = totalRevenue * params.royalties_rate;
    const otherRepasses = totalRevenue * params.other_repasses_rate;
    const cardFee = totalRevenue * params.card_fee_rate;
    const marketing = totalRevenue * params.marketing_rate;
    const systemFee = currentStores * params.system_fee_per_store;
    const amlabs = currentStores * params.amlabs_per_store;
    // Container e Geladeira são custos únicos (CAPEX), não mensais
    const maintenance = params.maintenance_fixed;
    const utilities = params.utilities_fixed;
    const accounting = params.accounting_fixed;
    
    // Custos fixos mensais ajustados pelo perfil
    const fixedCosts = (systemFee + amlabs + maintenance + utilities + accounting) * fixedCostsMultiplier;
    
    // Lucro Operacional (não duplicar dedução de systemFee e accounting, pois já estão em fixedCosts)
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
    
    // Lucro Líquido (assumindo sem impostos adicionais)
    const netProfit = operatingProfit;
    
    // Fluxo de caixa com pagamentos escalonados
    let cashFlow = netProfit;
    
    // Pagamentos escalonados do investimento inicial
    if (month === 1) {
      cashFlow -= params.franchise_fee; // Mês 1: paga taxa de franquia (30k)
    } else if (month === 2) {
      // Mês 2: paga implementação primeira loja (20k + container + geladeira)
      const firstStoreCapex = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
      cashFlow -= firstStoreCapex;
    } else if (month >= 3 && additionalStores > 0) {
      // Paga lojas adicionais para que abram a cada 3 meses a partir do mês 4
      // Mês 6: paga loja 1 (abre mês 7)
      // Mês 9: paga loja 2 (abre mês 10)
      // Mês 12: paga loja 3 (abre mês 13)
      const monthsSinceStart = month - 5; // Meses desde o mês 5
      if (monthsSinceStart > 0 && monthsSinceStart % 3 === 1) { // Paga nos meses 6, 9, 12, 15, etc.
        const storeIndexToPay = Math.floor(monthsSinceStart / 3); // Índice da loja (0, 1, 2, ...)
        if (storeIndexToPay < additionalStores) {
          // Paga mais uma loja (20k + container + geladeira)
          const additionalStoreCapex = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
          cashFlow -= additionalStoreCapex;
        }
      }
    }
    
    // Custos fixos já estão incluídos no netProfit (via fixedCosts deduzidos em operatingProfit)
    // Não precisamos deduzi-los novamente aqui
    
    cumulativeCash += cashFlow;
    
    monthlyResults.push({
      month,
      stores: currentStores,
      revenuePerStore,
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
  
  // Calcular Rentabilidade Mensal Média
  const finalCash = monthlyResults[monthlyResults.length - 1].cumulativeCash;
  
  // Calcular lucro líquido médio dos últimos 12 meses (ou todos se menos de 12)
  const lastMonths = monthlyResults.slice(-12);
  const avgMonthlyProfit = lastMonths.reduce((sum, month) => sum + month.netProfit, 0) / lastMonths.length;
  const monthlyRentability = (avgMonthlyProfit / totalInvestment) * 100;
  
  return {
    monthlyResults,
    totalInvestment,
    paybackPeriod,
    roi: monthlyRentability, // Mantém nome 'roi' para compatibilidade, mas agora é rentabilidade mensal
    finalCash,
    cenario
  };
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
  _perfilOperacao: string
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

  // Estimativa conservadora de lucro mensal por loja
  const estimatedMonthlyProfitPerStore = 2000; // Estimativa conservadora
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
    score -= 5;
    recommendations.push(`Perfil terceirizado requer mais supervisão inicial`);
  } else if (perfilOperacao === 'integral') {
    score += 5;
    recommendations.push(`Perfil integral maximiza o potencial de crescimento`);
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
  // Não pode adicionar nos meses 1, 2 (período de implementação) ou 3 (primeira loja começando)
  if (month < 4 || month > monthlyResults.length) {
    return false;
  }
  
  const currentMonthResult = monthlyResults[month - 1];
  
  // Pode adicionar uma loja quando o lucro acumulado chegar a R$ 20.000
  // Isso significa que o saldo acumulado deve ser pelo menos -R$ (investimento_total - 20000)
  const minimumCumulativeCash = -(totalInvestment - 20000);
  
  return currentMonthResult.cumulativeCash >= minimumCumulativeCash;
}

// Função para adicionar uma loja a partir de um mês específico
export function addStoreToSimulation(
  simulationResult: AdvancedSimulationResult, 
  monthToAdd: number
): AdvancedSimulationResult {
  const { monthlyResults, totalInvestment } = simulationResult;
  
  if (!canAddStore(monthlyResults, monthToAdd, totalInvestment)) {
    throw new Error('Não é possível adicionar uma loja neste mês. Ainda não há lucro acumulado suficiente (R$ 20.000).');
  }
  
  // O investimento total não muda, pois a nova loja é paga com o lucro acumulado
  const newTotalInvestment = totalInvestment;
  const newMonthlyResults = [...monthlyResults];
  const params = behonestParams as BeHonestParams;
  
  // Obter multiplicador do cenário
  let cenarioMultiplier = 1;
  if (simulationResult.cenario) {
    switch(simulationResult.cenario) {
      case 'pessimista':
        cenarioMultiplier = 0.85;
        break;
      case 'medio':
        cenarioMultiplier = 1.0;
        break;
      case 'otimista':
        cenarioMultiplier = 1.15;
        break;
    }
  }
  
  // A partir do mês escolhido, recalcular com uma loja a mais
  for (let i = monthToAdd - 1; i < newMonthlyResults.length; i++) {
    const currentResult = newMonthlyResults[i];
    const previousResult = i > 0 ? newMonthlyResults[i - 1] : null;
    const month = currentResult.month;
    
    // Recalcular com +1 loja
    const newStores = currentResult.stores + 1;
    
    // Recalcular receita considerando período de implementação, crescimento e cenário
    let totalRevenue = 0;
    let revenuePerStore = 0;
    if (month > 2 && newStores > 0) {
      if (i === monthToAdd - 1) {
        // Mês da adição: nova loja não gera receita (período implementação)
        totalRevenue = currentResult.totalRevenue;
        revenuePerStore = currentResult.revenuePerStore;
      } else {
        // Mês seguinte: nova loja já opera e gera receita
        // Calcular receita com crescimento mensal e multiplicador do cenário
        const baseRevenuePerStore = params.rev_per_store_m2;
        const growthFactor = Math.pow(params.rev_growth_factor, month - 3);
        revenuePerStore = baseRevenuePerStore * growthFactor * cenarioMultiplier;
        totalRevenue = revenuePerStore * newStores;
      }
    } else {
      totalRevenue = currentResult.totalRevenue;
      revenuePerStore = currentResult.revenuePerStore;
    }
    
    // Recalcular todas as variáveis com a nova receita
    const tax = totalRevenue * params.simples_rate_m2;
    const netRevenue = totalRevenue - tax;
    const cmv = netRevenue * params.cmv_rate;
    const losses = netRevenue * params.loss_rate;
    const grossProfit = netRevenue - cmv - losses;
    const reposicao = totalRevenue * params.reposicao_rate;
    const royalties = totalRevenue * params.royalties_rate;
    const otherRepasses = totalRevenue * params.other_repasses_rate;
    const cardFee = totalRevenue * params.card_fee_rate;
    const marketing = totalRevenue * params.marketing_rate;
    const systemFee = newStores * params.system_fee_per_store;
    const amlabs = newStores * params.amlabs_per_store;
    // Container e Geladeira são CAPEX, não custos mensais
    const maintenance = params.maintenance_fixed;
    const utilities = params.utilities_fixed;
    const accounting = params.accounting_fixed;
    const fixedCosts = systemFee + amlabs + maintenance + utilities + accounting;
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
    const netProfit = operatingProfit;
    
    // Calcular fluxo de caixa
    let cashFlow = netProfit;
    
    // Se for o mês em que a loja é adicionada, subtrair CAPEX completo (20k + container + geladeira)
    if (i === monthToAdd - 1) {
      const additionalStoreCapex = params.capex_per_store + params.container_per_store + params.refrigerator_per_store;
      cashFlow -= additionalStoreCapex;
    }
    
    const cumulativeCash = previousResult ? previousResult.cumulativeCash + cashFlow : cashFlow;
    
    newMonthlyResults[i] = {
      month: currentResult.month,
      stores: newStores,
      totalRevenue,
      revenuePerStore,
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
      container: 0, // Container é CAPEX, não custo mensal
      refrigerator: 0, // Geladeira é CAPEX, não custo mensal
      maintenance,
      utilities,
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
  
  // Calcular Rentabilidade Mensal Média
  const lastMonths = newMonthlyResults.slice(-12);
  const avgMonthlyProfit = lastMonths.reduce((sum, month) => sum + month.netProfit, 0) / lastMonths.length;
  const monthlyRentability = (avgMonthlyProfit / newTotalInvestment) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi: monthlyRentability,
    finalCash,
    cenario: simulationResult.cenario
  };
}

export function removeStoreFromSimulation(results: AdvancedSimulationResult, monthToRemove: number): AdvancedSimulationResult {
  const params = behonestParams as BeHonestParams;
  
  // Verificar se é possível remover a loja
  if (monthToRemove < 4) {
    throw new Error('Não é possível remover lojas dos primeiros 3 meses');
  }
  
  // Verificar se existe uma loja para remover neste mês
  const monthResult = results.monthlyResults.find(r => r.month === monthToRemove);
  if (!monthResult || monthResult.stores <= 1) {
    throw new Error('Não há lojas adicionais para remover neste mês');
  }
  
  // Obter multiplicador do cenário
  let cenarioMultiplier = 1;
  if (results.cenario) {
    switch(results.cenario) {
      case 'pessimista':
        cenarioMultiplier = 0.85;
        break;
      case 'medio':
        cenarioMultiplier = 1.0;
        break;
      case 'otimista':
        cenarioMultiplier = 1.15;
        break;
    }
  }
  
  // Criar nova simulação sem a loja adicional
  const newMonthlyResults = results.monthlyResults.map(result => {
    if (result.month >= monthToRemove) {
      // Reduzir número de lojas a partir do mês de implementação
      const newStores = Math.max(1, result.stores - 1); // Mínimo 1 loja (primeira)
      
      // Recalcular receita considerando crescimento e cenário
      let totalRevenue = 0;
      let revenuePerStore = 0;
      if (result.month > 2 && newStores > 0) {
        const baseRevenuePerStore = params.rev_per_store_m2;
        const growthFactor = Math.pow(params.rev_growth_factor, result.month - 3);
        revenuePerStore = baseRevenuePerStore * growthFactor * cenarioMultiplier;
        totalRevenue = revenuePerStore * newStores;
      } else {
        totalRevenue = result.totalRevenue;
        revenuePerStore = result.revenuePerStore;
      }
      
      // Recalcular todos os valores baseados na nova receita
      const tax = totalRevenue * params.simples_rate_m2;
      const netRevenue = totalRevenue - tax;
      const cmv = netRevenue * params.cmv_rate;
      const losses = netRevenue * params.loss_rate;
      const grossProfit = netRevenue - cmv - losses;
      const reposicao = totalRevenue * params.reposicao_rate;
      const royalties = totalRevenue * params.royalties_rate;
      const otherRepasses = totalRevenue * params.other_repasses_rate;
      const cardFee = totalRevenue * params.card_fee_rate;
      const marketing = totalRevenue * params.marketing_rate;
      const systemFee = params.system_fee_per_store * newStores;
      const amlabs = params.amlabs_per_store * newStores;
      // Container e Geladeira são CAPEX, não custos mensais
      const maintenance = params.maintenance_fixed;
      const utilities = params.utilities_fixed;
      const accounting = params.accounting_fixed;
      const fixedCosts = systemFee + amlabs + maintenance + utilities + accounting;
      
      const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
      const netProfit = operatingProfit;
      
      // Recalcular fluxo de caixa
      let cashFlow = netProfit;
      
      const cumulativeCash = result.month === 1 ? cashFlow : 
        results.monthlyResults[result.month - 2].cumulativeCash + cashFlow;
      
      return {
        ...result,
        stores: newStores,
        totalRevenue,
        revenuePerStore,
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
  
  // Calcular Rentabilidade Mensal Média
  const lastMonths = newMonthlyResults.slice(-12);
  const avgMonthlyProfit = lastMonths.reduce((sum, month) => sum + month.netProfit, 0) / lastMonths.length;
  const monthlyRentability = (avgMonthlyProfit / newTotalInvestment) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi: monthlyRentability,
    finalCash,
    cenario: results.cenario
  };
}
