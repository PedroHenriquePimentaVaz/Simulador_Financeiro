import React, { useState } from 'react';
import { AdvancedSimulationResult } from '../utils/advancedCalculations';

interface InvestmentComparisonChartProps {
  franchiseResults: AdvancedSimulationResult;
  initialInvestment: number;
}

interface InvestmentOption {
  name: string;
  annualRate: number;
  color: string;
  description: string;
}

const InvestmentComparisonChart: React.FC<InvestmentComparisonChartProps> = ({ 
  franchiseResults, 
  initialInvestment 
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'2years' | '3years' | '5years'>('5years');

  const investmentOptions: InvestmentOption[] = [
    {
      name: 'SELIC (Taxa Atual)',
      annualRate: 10.75, // Taxa SELIC atual aproximada
      color: '#e74c3c',
      description: 'Taxa básica de juros do Brasil'
    },
    {
      name: 'CDB',
      annualRate: 10.0, // CDB geralmente rende próximo ao CDI (Selic)
      color: '#f39c12',
      description: 'Certificado de Depósito Bancário'
    },
    {
      name: 'Poupança',
      annualRate: 6.17, // Poupança rende 0,5% ao mês quando Selic > 8,5%
      color: '#27ae60',
      description: 'Caderneta de poupança tradicional'
    },
    {
      name: 'LCI/LCA',
      annualRate: 9.2,
      color: '#9b59b6',
      description: 'Isento de IR para pessoa física'
    }
  ];

  const periods = {
    '2years': { months: 24, label: '2 Anos' },
    '3years': { months: 36, label: '3 Anos' },
    '5years': { months: 60, label: '5 Anos' }
  };

  const calculateCompoundInterest = (principal: number, annualRate: number, months: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    return principal * Math.pow(1 + monthlyRate, months);
  };

  const getFranchiseValueAtPeriod = (months: number): number => {
    if (months >= franchiseResults.monthlyResults.length) {
      return franchiseResults.finalCash + initialInvestment;
    }
    return franchiseResults.monthlyResults[months - 1].cumulativeCash + initialInvestment;
  };

  const currentPeriod = periods[selectedPeriod];
  const franchiseValue = getFranchiseValueAtPeriod(currentPeriod.months);
  
  const comparisonData = investmentOptions.map(option => ({
    ...option,
    value: calculateCompoundInterest(initialInvestment, option.annualRate, currentPeriod.months),
    profit: calculateCompoundInterest(initialInvestment, option.annualRate, currentPeriod.months) - initialInvestment,
    roi: ((calculateCompoundInterest(initialInvestment, option.annualRate, currentPeriod.months) - initialInvestment) / initialInvestment) * 100
  }));

  const franchiseProfit = franchiseValue - initialInvestment;
  const franchiseROI = (franchiseProfit / initialInvestment) * 100;

  const maxValue = Math.max(franchiseValue, ...comparisonData.map(d => d.value));

  return (
    <div style={{ 
      backgroundColor: '#f8f9fa', 
      padding: '30px', 
      borderRadius: '12px',
      marginBottom: '20px'
    }}>
      {/* Period Selector */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: '30px',
        gap: '10px'
      }}>
        {Object.entries(periods).map(([key, period]) => (
          <button
            key={key}
            onClick={() => setSelectedPeriod(key as any)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: selectedPeriod === key ? '2px solid #3498db' : '2px solid #ddd',
              backgroundColor: selectedPeriod === key ? '#3498db' : 'white',
              color: selectedPeriod === key ? 'white' : '#333',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '700',
              transition: 'all 0.3s ease'
            }}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* Visual Bar Chart */}
      <div>
        <h3 style={{ 
          textAlign: 'center', 
          marginBottom: '20px',
          color: '#2c3e50',
          fontSize: '18px'
        }}>
          Comparação Visual de Retorno
        </h3>
        
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {/* Franchise Bar */}
          <div style={{ marginBottom: '15px' }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '5px' 
            }}>
              <span style={{ 
                width: '120px', 
                fontSize: '14px', 
                fontWeight: '700',
                color: '#001c54'
              }}>
                Franquia BeHonest
              </span>
              <div style={{ 
                flex: 1, 
                height: '25px', 
                backgroundColor: '#ecf0f1', 
                borderRadius: '5px',
                position: 'relative'
              }}>
                <div style={{
                  width: `${(franchiseValue / maxValue) * 100}%`,
                  height: '100%',
                  backgroundColor: '#001c54',
                  borderRadius: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '10px',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  R$ {franchiseValue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                </div>
              </div>
            </div>
          </div>

          {/* Investment Bars */}
          {comparisonData.map((investment, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: '5px' 
              }}>
                <span style={{ 
                  width: '120px', 
                  fontSize: '14px', 
                  fontWeight: '700',
                  color: investment.color
                }}>
                  {investment.name}
                </span>
                <div style={{ 
                  flex: 1, 
                  height: '20px', 
                  backgroundColor: '#ecf0f1', 
                  borderRadius: '5px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${(investment.value / maxValue) * 100}%`,
                    height: '100%',
                    backgroundColor: investment.color,
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '10px',
                    color: 'white',
                    fontSize: '11px',
                    fontWeight: '700'
                  }}>
                    R$ {investment.value.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div style={{ 
        marginTop: '30px', 
        padding: '20px', 
        backgroundColor: '#f0f4ff', 
        borderRadius: '10px',
        border: '1px solid #001c54'
      }}>
        <h4 style={{ 
          color: '#001c54', 
          marginBottom: '10px',
          textAlign: 'center'
        }}>
          💡 Análise Comparativa
        </h4>
        <div style={{ fontSize: '14px', lineHeight: '1.6', color: '#2c3e50' }}>
          <p>
            <strong>Vantagem da Franquia:</strong> A franquia BeHonest supera significativamente 
            os investimentos em renda fixa em todos os períodos analisados, oferecendo retornos 
            muito superiores ao mercado tradicional.
          </p>
          <p>
            <strong>Diferença no período de {currentPeriod.label}:</strong> A franquia gera 
            R$ {(franchiseValue - Math.max(...comparisonData.map(d => d.value))).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            a mais que o melhor investimento em renda fixa.
          </p>
        </div>
      </div>

      {/* Aviso sobre estimativas */}
      <div style={{
        marginTop: '25px',
        padding: '20px',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        border: '2px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '10px',
        fontSize: '13px',
        color: '#856404',
        lineHeight: '1.6'
      }}>
        <strong style={{ fontSize: '14px' }}>⚠️ Importante:</strong>
        <p style={{ margin: '8px 0 0 0' }}>
          As comparações apresentadas são baseadas em estimativas projetadas. Os resultados da franquia podem variar 
          dependendo de fatores como localização, gestão operacional, empenho do franqueado e condições econômicas. 
          Consulte sempre um especialista antes de tomar decisões de investimento.
        </p>
      </div>
    </div>
  );
};

export default InvestmentComparisonChart;
