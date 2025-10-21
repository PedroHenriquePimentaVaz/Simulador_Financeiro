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
  fixedCosts: number;
  accounting: number;
  operatingProfit: number;
  netProfit: number;
  cashFlow: number;
  cumulativeCash: number;
}

export interface SimulationResult {
  monthlyResults: MonthlyResult[];
  totalInvestment: number;
  paybackPeriod: number;
  roi: number;
  finalCash: number;
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
  lucroDesejado: number,
  investimentoInicial: number,
  perfilOperacao: string,
  months: number = 60
): SimulationResult {
  const params = behonestParams as BeHonestParams;
  
  // Calcular número de lojas baseado no investimento
  // Taxa de franquia (30k) + primeira loja (20k) + lojas adicionais (20k cada)
  const baseStores = 1; // Sempre começa com 1 loja
  const availableForAdditionalStores = investimentoInicial - params.franchise_fee - params.capex_per_store;
  const additionalStores = Math.floor(availableForAdditionalStores / params.capex_per_store);
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
      
      // Lojas adicionais: paga e opera no mesmo mês
      if (stores > 1 && month >= 4) {
        const additionalMonths = month - 3; // Meses desde que pode adicionar lojas
        const maxAdditionalStores = Math.min(additionalStores, additionalMonths);
        currentStores = 1 + maxAdditionalStores;
      }
    }
    
    // Período de implementação: primeiros 2 meses sem receita
    let totalRevenue = 0;
    let revenuePerStore = 0;
    if (month > 2 && currentStores > 0) {
      // Calcular receita com crescimento mensal (começando do mês 3)
      const baseRevenuePerStore = params.rev_per_store_m2;
      const growthFactor = Math.pow(params.rev_growth_factor, month - 3); // Ajustar para começar do mês 3
      revenuePerStore = baseRevenuePerStore * growthFactor;
      totalRevenue = revenuePerStore * currentStores;
    }
    
    // Imposto Simples
    const tax = totalRevenue * params.simples_rate_m2;
    const netRevenue = totalRevenue - tax;
    
    // CMV (Custo da Mercadoria Vendida)
    const cmv = totalRevenue * params.cmv_rate;
    
    // Perdas
    const losses = totalRevenue * params.loss_rate;
    
    // Lucro Bruto
    const grossProfit = netRevenue - cmv - losses;
    
    // Despesas operacionais
    const reposicao = totalRevenue * params.reposicao_rate;
    const royalties = totalRevenue * params.royalties_rate;
    const otherRepasses = totalRevenue * params.other_repasses_rate;
    const cardFee = totalRevenue * params.card_fee_rate;
    const marketing = totalRevenue * params.marketing_rate;
    const systemFee = currentStores * params.system_fee_per_store;
    const accounting = params.accounting_fixed;
    
    // Custos fixos ajustados pelo perfil
    const fixedCosts = (params.accounting_fixed + systemFee) * fixedCostsMultiplier;
    
    // Lucro Operacional
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - systemFee - fixedCosts;
    
    // Lucro Líquido (assumindo sem impostos adicionais)
    const netProfit = operatingProfit;
    
    // Fluxo de caixa com pagamentos escalonados
    let cashFlow = netProfit;
    
    // Pagamentos escalonados do investimento inicial
    if (month === 1) {
      cashFlow -= params.franchise_fee; // Mês 1: paga taxa de franquia (30k)
    } else if (month === 2) {
      cashFlow -= params.capex_per_store; // Mês 2: paga implementação primeira loja (20k)
    } else if (month >= 4 && additionalStores > 0) {
      // Mês 4+: paga cada loja adicional (20k cada)
      const storeIndexToPay = month - 4; // Índice da loja adicional a pagar
      if (storeIndexToPay < additionalStores) {
        cashFlow -= params.capex_per_store; // Paga mais uma loja (20k)
      }
    }
    
    // Nos primeiros 2 meses, ainda há custos fixos (contabilidade, sistema)
    if (month <= 2) {
      cashFlow -= fixedCosts; // Custos fixos sempre presentes
    }
    
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
  
  // Calcular ROI
  const finalCash = monthlyResults[monthlyResults.length - 1].cumulativeCash;
  const roi = ((finalCash + totalInvestment) / totalInvestment - 1) * 100;
  
  return {
    monthlyResults,
    totalInvestment,
    paybackPeriod,
    roi,
    finalCash
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
  perfilOperacao: string
): ViabilityAnalysis {
  const recommendations: string[] = [];
  let score = 100;
  let isViable = true;
  let message = '';
  let expectedMonthsToTarget: number | null = null;
  let maxRealisticMonthlyIncome = 0;

  // Calcular quantas lojas iniciais o investimento permite
  const franchiseFee = 30000; // Taxa de franquia
  const capexPerStore = 20000; // CAPEX por loja
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
  const recommendations: string[] = [];
  let score = 100;
  let isViable = true;
  let message = '';
  let expectedMonthsToTarget: number | null = null;
  let maxRealisticMonthlyIncome = 0;

  // Calcular quantas lojas iniciais o investimento permite
  const franchiseFee = 30000; // Taxa de franquia
  const capexPerStore = 20000; // CAPEX por loja
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
  const totalRevenue = monthlyResults.reduce((sum: number, result: MonthlyResult) => sum + result.totalRevenue, 0);
  const totalNetProfit = monthlyResults.reduce((sum: number, result: MonthlyResult) => sum + result.netProfit, 0);
  const totalStoresMonths = monthlyResults.reduce((sum: number, result: MonthlyResult) => sum + result.stores, 0);
  
  // Calcular médias mensais reais
  const averageMonthlyRevenuePerStore = totalStoresMonths > 0 ? totalRevenue / totalStoresMonths : 0;
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
  simulationResult: SimulationResult, 
  monthToAdd: number
): SimulationResult {
  const { monthlyResults, totalInvestment } = simulationResult;
  
  if (!canAddStore(monthlyResults, monthToAdd, totalInvestment)) {
    throw new Error('Não é possível adicionar uma loja neste mês. Ainda não há lucro acumulado suficiente (R$ 20.000).');
  }
  
  // O investimento total não muda, pois a nova loja é paga com o lucro acumulado
  const newTotalInvestment = totalInvestment;
  const newMonthlyResults = [...monthlyResults];
  
  // A partir do mês escolhido, recalcular com uma loja a mais
  for (let i = monthToAdd - 1; i < newMonthlyResults.length; i++) {
    const currentResult = newMonthlyResults[i];
    const previousResult = i > 0 ? newMonthlyResults[i - 1] : null;
    
    // Recalcular com +1 loja
    const newStores = currentResult.stores + 1;
    
    // Recalcular receita considerando período de implementação
    let totalRevenue = 0;
    if (i >= monthToAdd - 1) {
      // Nova loja tem período de implementação de 1 mês
      if (i === monthToAdd - 1) {
        // Mês da adição: nova loja não gera receita (período implementação)
        totalRevenue = currentResult.totalRevenue;
      } else {
        // Mês seguinte: nova loja já opera e gera receita
        totalRevenue = currentResult.totalRevenue + (currentResult.totalRevenue / currentResult.stores);
      }
    } else {
      totalRevenue = currentResult.totalRevenue;
    }
    
    // Recalcular todas as variáveis com a nova receita
    const tax = totalRevenue * 0.04;
    const cmv = totalRevenue * 0.57;
    const losses = totalRevenue * 0.045;
    const grossProfit = totalRevenue - tax - cmv - losses;
    const reposicao = grossProfit * 0.174;
    const royalties = totalRevenue * 0.06;
    const otherRepasses = totalRevenue * 0.03;
    const cardFee = totalRevenue * 0.016;
    const marketing = totalRevenue * 0.01;
    const systemFee = newStores * 150; // R$ 150 por loja
    const accounting = newStores * 116.67; // R$ 116.67 por loja
    const fixedCosts = systemFee + accounting;
    const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - fixedCosts;
    const netProfit = operatingProfit;
    
    // Calcular fluxo de caixa
    let cashFlow = netProfit;
    
    // Se for o mês em que a loja é adicionada, subtrair R$ 20.000 do fluxo de caixa
    if (i === monthToAdd - 1) {
      cashFlow -= 20000;
    }
    
    const cumulativeCash = previousResult ? previousResult.cumulativeCash + cashFlow : cashFlow;
    
    newMonthlyResults[i] = {
      month: currentResult.month,
      stores: newStores,
      totalRevenue,
      revenuePerStore: totalRevenue / newStores,
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
      accounting,
      fixedCosts,
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
  const roi = ((finalCash + newTotalInvestment) / newTotalInvestment - 1) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi,
    finalCash
  };
}

export function removeStoreFromSimulation(results: SimulationResult, monthToRemove: number): SimulationResult {
  const params = behonestParams as BeHonestParams;
  
  // Verificar se é possível remover a loja
  if (monthToRemove < 4) {
    throw new Error('Não é possível remover lojas dos primeiros 3 meses');
  }
  
  // Encontrar o mês onde a loja foi adicionada (mês anterior ao mês de implementação)
  const storeAddedMonth = monthToRemove - 1;
  
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
      
      // Recalcular receita
      const revenuePerStore = params.rev_per_store_m2 * 50; // Assumindo 50m² por loja
      const totalRevenue = newStores * revenuePerStore;
      
      // Recalcular todos os valores baseados na nova receita
      const tax = totalRevenue * params.simples_rate_m2;
      const netRevenue = totalRevenue - tax;
      const cmv = netRevenue * params.cmv_rate;
      const losses = netRevenue * params.loss_rate;
      const grossProfit = netRevenue - cmv - losses;
      const reposicao = grossProfit * params.reposicao_rate;
      const royalties = grossProfit * params.royalties_rate;
      const otherRepasses = grossProfit * params.other_repasses_rate;
      const cardFee = totalRevenue * params.card_fee_rate;
      const marketing = totalRevenue * params.marketing_rate;
      const systemFee = params.system_fee_per_store * newStores;
      const accounting = params.accounting_fixed;
      const fixedCosts = 0; // Sem custos fixos adicionais
      
      const operatingProfit = grossProfit - reposicao - royalties - otherRepasses - cardFee - marketing - systemFee - accounting - fixedCosts;
      const netProfit = operatingProfit;
      
      // Recalcular fluxo de caixa
      let cashFlow = netProfit;
      
      const cumulativeCash = result.month === 1 ? cashFlow : 
        results.monthlyResults[result.month - 2].cumulativeCash + cashFlow;
      
      return {
        ...result,
        stores: newStores,
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
        accounting,
        fixedCosts,
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
  const roi = ((finalCash + newTotalInvestment) / newTotalInvestment - 1) * 100;
  
  return {
    monthlyResults: newMonthlyResults,
    totalInvestment: newTotalInvestment,
    paybackPeriod,
    roi,
    finalCash
  };
}
