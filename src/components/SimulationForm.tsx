import React, { useState, useEffect } from 'react';
import { SimulationData } from '../types/simulation';
import { analyzeInvestmentViability, ViabilityAnalysis } from '../utils/advancedCalculations';

interface SimulationFormProps {
  initialData: SimulationData;
  onSimulate: (data: SimulationData) => void;
}

const SimulationForm: React.FC<SimulationFormProps> = ({ initialData, onSimulate }) => {
  const [formData, setFormData] = useState<SimulationData>(initialData);
  const [viabilityAnalysis, setViabilityAnalysis] = useState<ViabilityAnalysis | null>(null);

  // Analisar viabilidade sempre que os dados mudarem
  useEffect(() => {
    if (formData.investimentoInicial && formData.lucroDesejado) {
      const analysis = analyzeInvestmentViability(
        formData.investimentoInicial,
        formData.lucroDesejado,
        formData.perfilOperacao || 'gestao'
      );
      setViabilityAnalysis(analysis);
    }
  }, [formData.investimentoInicial, formData.lucroDesejado, formData.perfilOperacao]);

  const handleInputChange = (field: keyof SimulationData, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Função para formatar números brasileiros
  const formatBrazilianNumber = (value: string): number => {
    // Remove tudo exceto números
    const cleanValue = value.replace(/[^\d]/g, '');
    return cleanValue ? Number(cleanValue) : 0;
  };

  // Função para exibir números formatados
  const formatDisplayNumber = (value: number | string): string => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? formatBrazilianNumber(value) : value;
    return numValue.toLocaleString('pt-BR');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Não calculamos mais o faturamento aqui, apenas passamos os dados
    const margemLiquida = 13; // Média entre 12-15%
    const faturamentoMensal = 0; // Será calculado pela simulação
    
    // Ajustar despesas baseado no perfil de operação
    let despesasFixas = 2000;
    let despesasVariaveis = 1000;
    
    switch(formData.perfilOperacao) {
      case 'integral':
        despesasFixas = 1500;
        despesasVariaveis = 800;
        break;
      case 'gestao':
        despesasFixas = 2000;
        despesasVariaveis = 1200;
        break;
      case 'terceirizar':
        despesasFixas = 3000;
        despesasVariaveis = 1500;
        break;
    }
    
    const simulatedData = {
      investimentoInicial: typeof formData.investimentoInicial === 'string' 
        ? formatBrazilianNumber(formData.investimentoInicial) 
        : formData.investimentoInicial,
      faturamentoMensal: faturamentoMensal,
      margemLiquida: margemLiquida,
      despesasFixas: despesasFixas,
      despesasVariaveis: despesasVariaveis,
      periodoSimulacao: 60,
      lucroDesejado: typeof formData.lucroDesejado === 'string' 
        ? formatBrazilianNumber(formData.lucroDesejado) 
        : formData.lucroDesejado,
      perfilOperacao: formData.perfilOperacao
    };
    
    onSimulate(simulatedData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label className="form-label">Quanto você deseja tirar mensalmente do negócio? *</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '16px',
            fontWeight: '500',
            zIndex: 1
          }}>
            R$
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: 5.000"
            value={formatDisplayNumber(formData.lucroDesejado || '')}
            onChange={(e) => {
              const numericValue = formatBrazilianNumber(e.target.value);
              handleInputChange('lucroDesejado', numericValue);
            }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '5px', 
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Em média são R$ 2.000 lucro por loja
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Quanto você tem de disponibilidade de investimento? *</label>
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#666',
            fontSize: '16px',
            fontWeight: '500',
            zIndex: 1
          }}>
            R$
          </span>
          <input
            type="text"
            className="form-input"
            placeholder="Ex: 80.000"
            value={formatDisplayNumber(formData.investimentoInicial || '')}
            onChange={(e) => {
              const numericValue = formatBrazilianNumber(e.target.value);
              handleInputChange('investimentoInicial', numericValue);
            }}
            style={{ paddingLeft: '40px' }}
          />
        </div>
        <p style={{ 
          fontSize: '12px', 
          color: '#666', 
          marginTop: '5px', 
          marginBottom: '0',
          fontStyle: 'italic'
        }}>
          Deve ser condizente com quanto você gostaria de receber mensalmente
        </p>
      </div>

      <div className="form-group">
        <label className="form-label">Qual seu perfil de operação? *</label>
        <select 
          className="form-select" 
          value={formData.perfilOperacao || 'gestao'}
          onChange={(e) => handleInputChange('perfilOperacao', e.target.value)}
        >
          <option value="integral">1 - Dedicar integralmente à operação</option>
          <option value="gestao">2 - Fazer apenas a gestão e terceirizar</option>
          <option value="terceirizar">3 - Terceirizar tudo e contratar equipe gerencial</option>
        </select>
      </div>

      {/* Análise de Viabilidade */}
      {viabilityAnalysis && (
        <div style={{
          backgroundColor: viabilityAnalysis.isViable ? '#e8f5e8' : '#ffeaea',
          border: `2px solid ${viabilityAnalysis.isViable ? '#28a745' : '#dc3545'}`,
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <h4 style={{
              color: viabilityAnalysis.isViable ? '#155724' : '#721c24',
              margin: 0,
              fontSize: '18px'
            }}>
              {viabilityAnalysis.message}
            </h4>
            <div style={{
              backgroundColor: viabilityAnalysis.score >= 80 ? '#28a745' : 
                              viabilityAnalysis.score >= 60 ? '#ffc107' : 
                              viabilityAnalysis.score >= 40 ? '#fd7e14' : '#dc3545',
              color: 'white',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '14px',
              fontWeight: '700'
            }}>
              {viabilityAnalysis.score}/100
            </div>
          </div>

          <div style={{ marginBottom: '15px', color: '#2c3e50', fontSize: '15px' }}>
            <strong style={{ color: '#1a252f' }}>Lucro mensal realista:</strong> R$ {viabilityAnalysis.maxRealisticMonthlyIncome.toLocaleString('pt-BR')}
          </div>

          {viabilityAnalysis.recommendations.length > 0 && (
            <div style={{ color: '#2c3e50' }}>
              <strong style={{ color: '#1a252f', fontSize: '15px' }}>Recomendações:</strong>
              <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
                {viabilityAnalysis.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: '5px', fontSize: '14px', color: '#2c3e50' }}>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <button type="submit" className="submit-button">
        Simular Investimento
      </button>
    </form>
  );
};

export default SimulationForm;
