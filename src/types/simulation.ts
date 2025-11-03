export interface SimulationData {
  investimentoInicial: number;
  faturamentoMensal: number;
  margemLiquida: number;
  despesasFixas: number;
  despesasVariaveis: number;
  periodoSimulacao: number;
  lucroDesejado?: number;
  perfilOperacao?: string;
  cenario?: 'pessimista' | 'medio' | 'otimista';
  nome?: string;
  telefone?: string;
  email?: string;
  estado?: string;
  cidade?: string;
}

export interface SimulationResult {
  faturamentoTotal: number;
  lucroBruto: number;
  lucroLiquido: number;
  payback: number;
  roi: number;
  margemLiquida: number;
  projecaoMensal: Array<{
    mes: number;
    faturamento: number;
    despesas: number;
    lucro: number;
    acumulado: number;
  }>;
}

