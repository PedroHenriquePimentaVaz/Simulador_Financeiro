import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { AdvancedSimulationResult, formatCurrency, formatPercentage, canAddStore, addStoreToSimulation } from '../utils/advancedCalculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface AdvancedResultsDisplayProps {
  results: AdvancedSimulationResult;
  currentResults: AdvancedSimulationResult;
  lucroDesejado?: number;
  onResultsUpdate?: (newResults: AdvancedSimulationResult) => void;
}

const AdvancedResultsDisplay: React.FC<AdvancedResultsDisplayProps> = ({ results, currentResults, lucroDesejado, onResultsUpdate }) => {
  const [showMonthlyDetails, setShowMonthlyDetails] = useState(false);
  const [_originalResults, _setOriginalResults] = useState<AdvancedSimulationResult>(results);
  const [selectedMonth, setSelectedMonth] = useState<number>(1);
  const [showAddStoreForm, setShowAddStoreForm] = useState(false);
  const [addedStores, setAddedStores] = useState<Array<{month: number, implementationMonth: number}>>([]);
  
  const { monthlyResults, totalInvestment, paybackPeriod, roi, finalCash } = currentResults;

  // Calcular tempo para alcançar a renda desejada
  const calculateTimeToTargetIncome = (): number | null => {
    if (!lucroDesejado) return null;
    
    for (let i = 0; i < monthlyResults.length; i++) {
      if (monthlyResults[i].netProfit >= lucroDesejado) {
        return i + 1; // Retorna o mês (1-indexed)
      }
    }
    return null; // Não alcançado
  };

  const timeToTargetIncome = calculateTimeToTargetIncome();

  const handleAddStore = () => {
    try {
      const newResults = addStoreToSimulation(currentResults, selectedMonth);
      if (onResultsUpdate) {
        onResultsUpdate(newResults);
      }
      
      // Adicionar à lista de lojas adicionadas
      const newAddedStore = {
        month: selectedMonth,
        implementationMonth: selectedMonth + 1
      };
      setAddedStores(prev => [...prev, newAddedStore]);
      
      setShowAddStoreForm(false);
      alert(`Loja adicionada com sucesso a partir do mês ${selectedMonth + 1}!`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao adicionar loja');
    }
  };

  const canAddStoreInMonth = (month: number) => {
    return canAddStore(monthlyResults, month, totalInvestment);
  };

  const handleRemoveStore = (_implementationMonth: number) => {
    // Voltar ao estado original (antes de qualquer adição de loja)
    if (onResultsUpdate) {
      onResultsUpdate(results);
    }
    
    // Limpar lista de lojas adicionadas
    setAddedStores([]);
    
    alert(`Loja removida! Voltando ao estado original.`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Configurações gerais
    const pageWidth = 297; // A4 landscape width
    const margin = 10; // Reduzido de 15 para 10
    const contentWidth = pageWidth - (margin * 2);
    
    // Header mais compacto
    doc.setFontSize(18); // Reduzido de 20 para 18
    doc.setTextColor(0, 28, 84);
    doc.text('BeHonest - Simulação Financeira Completa (5 Anos)', margin, 15); // Reduzido de 20 para 15
    
    doc.setFontSize(9); // Reduzido de 10 para 9
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, margin, 22); // Reduzido de 28 para 22
    
    // Resumo executivo mais compacto
    doc.setFontSize(11); // Reduzido de 12 para 11
    doc.setTextColor(0, 0, 0);
    doc.text('RESUMO EXECUTIVO', margin, 30); // Reduzido de 40 para 30
    
    doc.setFontSize(9); // Reduzido de 10 para 9
    doc.text(`• Investimento Total: ${formatCurrency(totalInvestment)}`, margin, 36); // Reduzido de 48 para 36
    doc.text(`• Saldo Final: ${formatCurrency(finalCash)}`, margin, 42); // Reduzido de 54 para 42
    doc.text(`• ROI: ${formatPercentage(roi)}`, margin, 48); // Reduzido de 60 para 48
    doc.text(`• Payback: ${paybackPeriod > 0 ? paybackPeriod + ' meses' : 'Não alcançado'}`, margin, 54); // Reduzido de 66 para 54
    
    // Métricas para a tabela
    const metrics = [
      { key: 'stores', label: 'Lojas' },
      { key: 'totalRevenue', label: 'Receita Total', formatter: formatCurrency },
      { key: 'grossProfit', label: 'Lucro Bruto', formatter: formatCurrency },
      { key: 'netProfit', label: 'Lucro Líquido', formatter: formatCurrency },
      { key: 'tax', label: 'Impostos', formatter: formatCurrency },
      { key: 'cmv', label: 'CMV', formatter: formatCurrency },
      { key: 'royalties', label: 'Royalties', formatter: formatCurrency },
      { key: 'marketing', label: 'Marketing', formatter: formatCurrency },
      { key: 'cumulativeCash', label: 'Saldo Acumulado', formatter: formatCurrency }
    ];
    
    // Dividir em anos (12 meses por ano)
    const years = [];
    for (let year = 0; year < 5; year++) {
      const startMonth = year * 12;
      const endMonth = Math.min(startMonth + 12, monthlyResults.length);
      years.push({
        year: year + 1,
        months: monthlyResults.slice(startMonth, endMonth),
        startMonth: startMonth + 1,
        endMonth: endMonth
      });
    }
    
    let currentY = 60; // Reduzido de 80 para 60
    
    // Gerar tabela para cada ano
    years.forEach((yearData, yearIndex) => {
      if (yearIndex > 0) {
        doc.addPage();
        currentY = 15; // Reduzido de 20 para 15
      }
      
      // Título do ano mais compacto
      doc.setFontSize(12); // Reduzido de 14 para 12
      doc.setTextColor(0, 28, 84);
      doc.text(`ANO ${yearData.year} (Meses ${yearData.startMonth} a ${yearData.endMonth})`, margin, currentY);
      currentY += 6; // Reduzido de 10 para 6
      
      // Criar dados da tabela para este ano
      const tableData: any[] = [];
      metrics.forEach(metric => {
        const row = [metric.label];
        yearData.months.forEach(result => {
          const value = (result as any)[metric.key];
          row.push(metric.formatter ? metric.formatter(value) : value.toString());
        });
        tableData.push(row);
      });
      
      // Headers para este ano
      const headers = ['Métrica'];
      yearData.months.forEach((_, _index) => {
        headers.push(`M${yearData.startMonth + _index}`);
      });
      
      // Configurações da tabela mais compactas
      const columnWidth = (contentWidth - 45) / (headers.length - 1); // Reduzido de 50 para 45
      
      autoTable(doc, {
        head: [headers],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        styles: {
          fontSize: 8, // Reduzido de 9 para 8
          cellPadding: 2, // Reduzido de 3 para 2
          overflow: 'linebreak',
          halign: 'center',
          lineWidth: 0.1 // Linhas mais finas
        },
        headStyles: {
          fillColor: [0, 28, 84],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 8, // Reduzido de 9 para 8
          cellPadding: 2 // Reduzido de 3 para 2
        },
        columnStyles: {
          0: { 
            fontStyle: 'bold', 
            fillColor: [248, 249, 250], 
            halign: 'left', 
            cellWidth: 45, // Reduzido de 50 para 45
            fontSize: 7 // Reduzido de 8 para 7
          }
        },
        didParseCell: function(data) {
          // Aplicar cores para Saldo Acumulado
          if (data.row.index === metrics.length - 1 && data.column.index > 0) {
            const cellValue = data.cell.text[0];
            if (cellValue && cellValue.startsWith('-')) {
              data.cell.styles.textColor = [220, 53, 69];
            } else if (cellValue && cellValue.startsWith('R$') && !cellValue.includes('-')) {
              data.cell.styles.textColor = [40, 167, 69];
            }
          }
          
          // Definir largura das colunas de meses
          if (data.column.index > 0) {
            data.cell.styles.cellWidth = columnWidth;
          }
        },
        margin: { left: margin, right: margin },
        pageBreak: 'avoid',
        tableLineWidth: 0.1, // Linhas da tabela mais finas
        tableLineColor: [200, 200, 200] // Cor mais suave
      });
      
      // Adicionar resumo do ano mais compacto
      const yearEndResult = yearData.months[yearData.months.length - 1];
      
      const finalY = (doc as any).lastAutoTable.finalY || currentY + 80; // Reduzido de 100 para 80
      
      doc.setFontSize(9); // Reduzido de 10 para 9
      doc.setTextColor(0, 0, 0);
      doc.text(`Resumo Ano ${yearData.year}:`, margin, finalY + 5); // Reduzido de 10 para 5
      doc.text(`• Saldo Final: ${formatCurrency(yearEndResult.cumulativeCash)}`, margin, finalY + 11); // Reduzido de 18 para 11
      doc.text(`• Lojas Finais: ${yearEndResult.stores}`, margin, finalY + 17); // Reduzido de 26 para 17
      doc.text(`• Receita Total: ${formatCurrency(yearData.months.reduce((sum, m) => sum + m.totalRevenue, 0))}`, margin, finalY + 23); // Reduzido de 34 para 23
    });
    
    doc.save(`BeHonest_Simulacao_Completa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = monthlyResults.map(result => ({
    mes: result.month,
    receita: result.totalRevenue,
    lucroLiquido: result.netProfit,
    fluxoCaixa: result.cumulativeCash,
    fluxoCaixaPositivo: result.cumulativeCash >= 0 ? result.cumulativeCash : null,
    fluxoCaixaNegativo: result.cumulativeCash < 0 ? result.cumulativeCash : null,
    lojas: result.stores
  }));

  const lastMonth = monthlyResults[monthlyResults.length - 1];
  // const avgMonthlyProfit = monthlyResults.reduce((sum, result) => sum + result.netProfit, 0) / monthlyResults.length;

  return (
    <div className="advanced-results">
      <h3 className="results-title">Resultados da Simulação Avançada</h3>
      
      <div className="results-summary">
        <div className="summary-card investment-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h4>Investimento Total</h4>
            <p className="summary-value">{formatCurrency(totalInvestment)}</p>
            <span className="card-period">5 Anos</span>
          </div>
        </div>
        
        <div className="summary-card balance-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h4>Saldo Final</h4>
            <p className={`summary-value ${finalCash >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(finalCash)}
            </p>
            <span className="card-period">5 Anos</span>
          </div>
        </div>
        
        <div className="summary-card roi-card">
          <div className="card-icon">🎯</div>
          <div className="card-content">
            <h4>ROI</h4>
            <p className="summary-value positive">{formatPercentage(roi)}</p>
            <span className="card-period">5 Anos</span>
          </div>
        </div>
        
        <div className="summary-card payback-card">
          <div className="card-icon">⏰</div>
          <div className="card-content">
            <h4>Payback</h4>
            <p className="summary-value">
              {paybackPeriod > 0 ? `${paybackPeriod} meses` : 'Não alcançado'}
            </p>
            <span className="card-period">5 Anos</span>
          </div>
        </div>
        
        {lucroDesejado && (
          <div className="summary-card target-card">
            <div className="card-icon">🏆</div>
            <div className="card-content">
              <h4>Tempo para Meta</h4>
              <p className="summary-value">
                {timeToTargetIncome ? `${timeToTargetIncome} meses` : 'Não alcançado'}
              </p>
              <span className="card-period">Renda Mensal</span>
            </div>
          </div>
        )}
      </div>

      {/* Aviso sobre estimativas */}
      <div style={{
        marginTop: '30px',
        marginBottom: '30px',
        padding: '20px',
        backgroundColor: 'rgba(255, 193, 7, 0.1)',
        border: '2px solid rgba(255, 193, 7, 0.3)',
        borderRadius: '10px',
        fontSize: '14px',
        color: '#856404',
        lineHeight: '1.7'
      }}>
        <strong style={{ fontSize: '16px' }}>⚠️ Importante:</strong>
        <p style={{ margin: '10px 0 0 0' }}>
          Os valores apresentados nesta simulação são <strong>estimativas baseadas em médias do mercado</strong>. Os resultados reais podem variar significativamente dependendo de fatores como:
        </p>
        <ul style={{ margin: '10px 0 0 20px', paddingLeft: '10px' }}>
          <li>Localização e perfil dos clientes</li>
          <li>Gestão operacional e empenho do franqueado</li>
          <li>Condições econômicas e sazonalidade</li>
          <li>Expansão e performance das lojas</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontStyle: 'italic' }}>
          Estas são projeções e não garantias de desempenho futuro. Consulte sempre um especialista antes de tomar decisões de investimento.
        </p>
      </div>

      <div className="detailed-breakdown">
        <h4>Último Mês (Mês {lastMonth.month})</h4>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '20px',
          alignItems: 'start'
        }}>
          {/* Coluna Esquerda - Receitas e Lucros */}
          <div className="breakdown-grid">
            {/* Informações Gerais */}
            <div className="breakdown-item">
              <span>Lojas:</span>
              <span>{lastMonth.stores}</span>
            </div>
            
            {/* Receitas */}
            <div className="breakdown-item" style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '700', color: '#2e7d32' }}>Receita Bruta:</span>
              <span style={{ fontWeight: '700', color: '#2e7d32', fontSize: '16px' }}>{formatCurrency(lastMonth.totalRevenue)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#fff3e0', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#e65100' }}>Imposto Simples:</span>
              <span style={{ fontWeight: '600', color: '#e65100' }}>-{formatCurrency(lastMonth.tax)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '700', color: '#2e7d32' }}>Receita Líquida:</span>
              <span style={{ fontWeight: '700', color: '#2e7d32', fontSize: '16px' }}>{formatCurrency(lastMonth.totalRevenue - lastMonth.tax)}</span>
            </div>
            
            {/* Despesas que reduzem para Lucro Bruto */}
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>CMV:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.cmv)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Perdas:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.losses)}</span>
            </div>
            
            {/* Lucro Bruto */}
            <div className="breakdown-item" style={{ backgroundColor: '#e3f2fd', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '700', color: '#1565c0' }}>Lucro Bruto:</span>
              <span style={{ fontWeight: '700', color: '#1565c0', fontSize: '16px' }}>{formatCurrency(lastMonth.grossProfit)}</span>
            </div>
            
            {/* Lucro Líquido */}
            <div className="breakdown-item" style={{ backgroundColor: '#e8f5e9', padding: '12px', borderRadius: '6px', border: '2px solid #4caf50' }}>
              <span style={{ fontWeight: '700', color: '#1b5e20', fontSize: '16px' }}>Lucro Líquido:</span>
              <span style={{ fontWeight: '700', color: '#1b5e20', fontSize: '18px' }}>{formatCurrency(lastMonth.netProfit)}</span>
            </div>
          </div>

          {/* Coluna Direita - Todas as Despesas Operacionais */}
          <div className="breakdown-grid">
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Reposição:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.reposicao)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Royalties:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.royalties)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Outros Repasses:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.otherRepasses)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Taxa de Cartão:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.cardFee)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Marketing:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.marketing)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Sistema:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.systemFee)}</span>
            </div>
            <div className="breakdown-item" style={{ backgroundColor: '#ffebee', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Contabilidade:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>-{formatCurrency(lastMonth.accounting)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seção de Adicionar Lojas */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '25px',
        borderRadius: '12px',
        marginBottom: '30px',
        border: '2px solid #001c54'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h4 style={{ color: '#001c54', fontSize: '18px', fontWeight: '700' }}>
            🏪 Simulação Interativa - Adicionar Lojas
          </h4>
          <button
            onClick={() => setShowAddStoreForm(!showAddStoreForm)}
            style={{
              padding: '8px 16px',
              backgroundColor: showAddStoreForm ? '#dc3545' : '#001c54',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {showAddStoreForm ? 'Cancelar' : 'Adicionar Loja'}
          </button>
        </div>
        
        <p style={{ color: '#666', marginBottom: '15px', fontSize: '14px' }}>
          Experimente adicionar lojas para ver como ficaria sua simulação. Cada loja custa R$ 20.000 e só pode ser adicionada 
          quando você já tiver ganho pelo menos R$ 20.000 com o investimento inicial. Você pode voltar ao estado original a qualquer momento.
        </p>
        
        {showAddStoreForm && (
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #ddd'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ 
                display: 'block', 
                color: '#333', 
                fontWeight: '500', 
                marginBottom: '8px' 
              }}>
                Escolha o mês para adicionar a loja:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '2px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                {monthlyResults.map((result, _index) => (
                  <option 
                    key={result.month} 
                    value={result.month}
                    disabled={!canAddStoreInMonth(result.month)}
                  >
                    Mês {result.month} - Saldo: {formatCurrency(result.cumulativeCash)}
                    {!canAddStoreInMonth(result.month) ? ' (Não pode adicionar)' : ' ✓'}
                  </option>
                ))}
              </select>
            </div>
            
            <div style={{
              backgroundColor: canAddStoreInMonth(selectedMonth) ? '#e8f5e8' : '#ffeaea',
              padding: '15px',
              borderRadius: '6px',
              marginBottom: '15px',
              border: `1px solid ${canAddStoreInMonth(selectedMonth) ? '#28a745' : '#dc3545'}`
            }}>
              <div style={{ 
                color: canAddStoreInMonth(selectedMonth) ? '#155724' : '#721c24',
                fontWeight: '500'
              }}>
                {canAddStoreInMonth(selectedMonth) ? (
                  <>
                    ✅ <strong>Pode adicionar loja no mês {selectedMonth}</strong><br/>
                    <small>Investimento total permanece: {formatCurrency(totalInvestment)} (pago com lucro acumulado)</small>
                  </>
                ) : (
                  <>
                    ❌ <strong>Não pode adicionar loja no mês {selectedMonth}</strong><br/>
                    <small>Ainda não há lucro acumulado suficiente (R$ 20.000)</small>
                  </>
                )}
              </div>
            </div>
            
            <button
              onClick={handleAddStore}
              disabled={!canAddStoreInMonth(selectedMonth)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: canAddStoreInMonth(selectedMonth) ? '#001c54' : '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: canAddStoreInMonth(selectedMonth) ? 'pointer' : 'not-allowed',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Adicionar Loja (pago com lucro acumulado)
            </button>
          </div>
        )}
      </div>

      {/* Seção de Lojas Adicionadas */}
      {addedStores.length > 0 && (
        <div style={{
          backgroundColor: '#e8f4fd',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '30px',
          border: '2px solid #2196f3'
        }}>
          <h4 style={{ color: '#001c54', fontSize: '18px', fontWeight: '700', marginBottom: '20px' }}>
            🏪 Visualização Temporária - Lojas Adicionadas
          </h4>
          
          <div style={{ display: 'grid', gap: '15px' }}>
            {addedStores.map((store, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong style={{ color: '#001c54' }}>Loja #{index + 1}</strong>
                  <div style={{ color: '#666', fontSize: '14px', marginTop: '5px' }}>
                    <span>Adicionada no mês {store.month}</span>
                    <span style={{ margin: '0 10px' }}>•</span>
                    <span>Implementação no mês {store.implementationMonth}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStore(store.implementationMonth)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  ↩️ Voltar ao Original
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="charts-section">
        <div className="chart-container">
          <h4>Evolução Mensal</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Número de Lojas') {
                    return [value, name];
                  }
                  return [formatCurrency(value as number), name];
                }}
                labelFormatter={(label) => `Mês ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="receita" 
                stroke="#ff9800" 
                strokeWidth={2}
                name="Receita"
                yAxisId="left"
              />
              <Line 
                type="monotone" 
                dataKey="lucroLiquido" 
                stroke="#4caf50" 
                strokeWidth={2}
                name="Lucro Líquido"
                yAxisId="left"
              />
              <Line 
                type="monotone" 
                dataKey="lojas" 
                stroke="#2196f3" 
                strokeWidth={2}
                name="Número de Lojas"
                yAxisId="right"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Fluxo de Caixa Acumulado</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'Saldo Acumulado (Positivo)' || name === 'Saldo Acumulado (Negativo)') {
                    return [formatCurrency(value as number), 'Saldo Acumulado'];
                  }
                  return [formatCurrency(value as number), name];
                }}
                labelFormatter={(label) => `Mês ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="fluxoCaixaPositivo" 
                stroke="#4caf50" 
                strokeWidth={3}
                name="Saldo Acumulado (Positivo)"
                dot={{ fill: '#4caf50', stroke: 'white', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="fluxoCaixaNegativo" 
                stroke="#f44336" 
                strokeWidth={3}
                name="Saldo Acumulado (Negativo)"
                dot={{ fill: '#f44336', stroke: 'white', strokeWidth: 2, r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-container">
          <h4>Número de Lojas</h4>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Mês ${label}`}
              />
              <Bar dataKey="lojas" fill="#ff9800" name="Lojas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="monthly-table">
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '15px'
        }}>
          <h4>📊 Planilha Completa (5 Anos)</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={exportToPDF}
              style={{
                padding: '12px 24px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#218838';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              📄 Baixar PDF
            </button>
            <button
              onClick={() => setShowMonthlyDetails(!showMonthlyDetails)}
              style={{
                padding: '12px 24px',
                backgroundColor: showMonthlyDetails ? '#dc3545' : '#001c54',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                minWidth: '160px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = showMonthlyDetails ? '#c82333' : '#001a4a';
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = showMonthlyDetails ? '#dc3545' : '#001c54';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
            >
              <span>{showMonthlyDetails ? '👆' : '👇'}</span>
              {showMonthlyDetails ? 'Ocultar Planilha' : 'Ver Planilha Completa'}
            </button>
          </div>
        </div>
        
        {showMonthlyDetails && (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Métrica</th>
                {monthlyResults.map((result) => (
                  <th key={result.month}>M{result.month}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Lojas</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{result.stores}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Receita</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.totalRevenue)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Lucro Bruto</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.grossProfit)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Lucro Líquido</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.netProfit)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Impostos</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.tax)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>CMV</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.cmv)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Royalties</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.royalties)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Marketing</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{formatCurrency(result.marketing)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Saldo Acumulado</strong></td>
                {monthlyResults.map((result) => (
                  <td 
                    key={result.month} 
                    className={result.cumulativeCash >= 0 ? 'positive' : 'negative'}
                  >
                    {formatCurrency(result.cumulativeCash)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        )}
      </div>

      {/* Next Steps Section */}
      <div className="next-steps-section">
        <h4>🚀 Próximos Passos</h4>
        <div className="next-steps-grid">
          <div className="next-step-card">
            <div className="step-icon">📞</div>
            <div className="step-content">
              <h5>Entre em Contato</h5>
              <p>Fale com nossos especialistas para tirar suas dúvidas</p>
              <button 
                className="step-btn primary"
                onClick={() => window.open('https://chat.whatsapp.com/KOKk46ZMmjMEZjvScFOf2f', '_blank')}
              >
                Falar com Especialista
              </button>
            </div>
          </div>
          
          <div className="next-step-card">
            <div className="step-icon">🔄</div>
            <div className="step-content">
              <h5>Nova Simulação</h5>
              <p>Teste diferentes cenários de investimento</p>
              <button className="step-btn secondary" onClick={() => window.location.reload()}>
                Nova Simulação
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedResultsDisplay;
