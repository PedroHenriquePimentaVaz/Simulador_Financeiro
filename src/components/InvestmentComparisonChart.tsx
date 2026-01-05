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
  const [selectedPeriod, setSelectedPeriod] = useState<number>(60);

  const periodOptions = [
    { months: 12, label: '1 Ano' },
    { months: 36, label: '3 Anos' },
    { months: 60, label: '5 Anos' }
  ];

  const currentPeriod = periodOptions.find(p => p.months === selectedPeriod) || periodOptions[2];

  const investmentOptions: InvestmentOption[] = [
    {
      name: 'SELIC (Taxa Atual)',
      annualRate: 15.0,
      color: '#e74c3c',
      description: 'Taxa básica de juros do Brasil'
    },
    {
      name: 'CDB',
      annualRate: 13.3,
      color: '#f39c12',
      description: 'Certificado de Depósito Bancário'
    },
    {
      name: 'Poupança',
      annualRate: 8.2,
      color: '#27ae60',
      description: 'Caderneta de poupança tradicional'
    },
    {
      name: 'LCI/LCA',
      annualRate: 14.3,
      color: '#9b59b6',
      description: 'Isento de IR para pessoa física'
    }
  ];

  const calculateCompoundInterest = (principal: number, annualRate: number, months: number): number => {
    const monthlyRate = annualRate / 100 / 12;
    return principal * Math.pow(1 + monthlyRate, months);
  };

  const getFranchiseValueAtPeriod = (months: number): number => {
    if (months <= 0) return 0;
    if (months >= franchiseResults.monthlyResults.length) {
      return franchiseResults.finalCash;
    }
    const monthIndex = Math.min(months - 1, franchiseResults.monthlyResults.length - 1);
    return franchiseResults.monthlyResults[monthIndex].cumulativeCash;
  };

  const franchiseValue = getFranchiseValueAtPeriod(currentPeriod.months);
  const comparisonData = investmentOptions.map(option => {
    const compounded = calculateCompoundInterest(initialInvestment, option.annualRate, currentPeriod.months);
    return {
    ...option,
      value: compounded,
      profit: compounded - initialInvestment,
      roi: ((compounded - initialInvestment) / initialInvestment) * 100
    };
  });
  const bestInvestment = comparisonData.reduce((prev, curr) => curr.value > prev.value ? curr : prev, comparisonData[0]);
  const bestFixedValue = bestInvestment.value;
  
  const periodMonthIndex = Math.min(currentPeriod.months - 1, franchiseResults.monthlyResults.length - 1);
  const periodMonth = franchiseResults.monthlyResults[periodMonthIndex];
  const periodStores = periodMonth ? Math.max(periodMonth.stores, 1) : 1;
  const perStoreValue = periodStores > 0 ? franchiseValue / periodStores : 0;
  const shortfall = Math.max(bestFixedValue - franchiseValue, 0);
  const suggestedExtraStores = perStoreValue > 0 ? Math.ceil(shortfall / perStoreValue) : 0;

  // const franchiseProfit = franchiseValue - initialInvestment;
  // const franchiseROI = (franchiseProfit / initialInvestment) * 100;

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
        marginBottom: '25px', 
        display: 'flex', 
        justifyContent: 'center',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        {periodOptions.map((period) => (
          <button
            key={period.months}
            onClick={() => setSelectedPeriod(period.months)}
            style={{
              padding: '12px 24px',
              backgroundColor: selectedPeriod === period.months ? '#001c54' : '#ffffff',
              color: selectedPeriod === period.months ? '#ffffff' : '#001c54',
              border: `2px solid #001c54`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: selectedPeriod === period.months ? '0 4px 12px rgba(0, 28, 84, 0.3)' : 'none'
            }}
            onMouseOver={(e) => {
              if (selectedPeriod !== period.months) {
                e.currentTarget.style.backgroundColor = '#f0f4ff';
              }
            }}
            onMouseOut={(e) => {
              if (selectedPeriod !== period.months) {
                e.currentTarget.style.backgroundColor = '#ffffff';
              }
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
          Comparação Visual de Retorno - {currentPeriod.label}
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
                Franquia Be Honest
              </span>
              <div style={{ 
                flex: 1, 
                height: '35px', 
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
                  fontSize: '14px',
                  fontWeight: '700',
                  textShadow: '1px 1px 2px rgba(0,0,0,0.3)'
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
                  height: '30px', 
                  backgroundColor: '#ecf0f1', 
                  borderRadius: '5px',
                  position: 'relative'
                }}>
                  <div style={{
                    width: `${Math.max((investment.value / maxValue) * 100, 15)}%`,
                    height: '100%',
                    backgroundColor: investment.color,
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingRight: '4px',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: '700',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap'
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
          {franchiseValue >= bestFixedValue ? (
            <>
          <p>
                <strong>Vantagem da Franquia:</strong> A franquia Be Honest supera os investimentos em renda fixa no período analisado.
          </p>
          <p>
            <strong>Diferença no período de {currentPeriod.label}:</strong> A franquia gera 
                R$ {(franchiseValue - bestFixedValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
            a mais que o melhor investimento em renda fixa.
          </p>
            </>
          ) : (
            <>
              <p>
                <strong>Alerta:</strong> Hoje a franquia fica R$ {shortfall.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} abaixo do melhor investimento ({bestInvestment.name}) em {currentPeriod.label}.
              </p>
              <p>
                <strong>Como melhorar:</strong> Considere projetar +{suggestedExtraStores} loja(s) (estimativa linear usando performance atual) para a franquia superar a renda fixa nesse período. Ajuste o número de lojas na simulação para testar.
              </p>
            </>
          )}
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
