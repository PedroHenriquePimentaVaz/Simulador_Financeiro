import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { AdvancedSimulationResult, formatCurrency, formatPercentage, canAddStore, addStoreToSimulation } from '../utils/advancedCalculations';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InvestmentComparisonChart from './InvestmentComparisonChart';

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
  const [isMobile, setIsMobile] = useState(false);
  
  const { monthlyResults, totalInvestment, paybackPeriod, roi, finalCash } = currentResults;

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 10;
    
    // Fundo azul da marca
    doc.setFillColor(0, 28, 84);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Adicionar logo da Be Honest da pasta public com proporção correta
    try {
      const logoPath = '/behonest-logo.png';
      // Tamanho da logo: 30mm de largura x 25mm de altura
      doc.addImage(logoPath, 'PNG', margin + 5, margin + 5, 30, 25);
    } catch (error) {
      console.log('Logo não carregada, continuando sem logo');
    }
    
    // Título - branco
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('Simulação Financeira Completa (5 Anos)', 60, 23);
    
    // Data - branco claro
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`, 55, 29);
    
    // Resumo Executivo com box estilizado
    const boxY = 40;
    const boxWidth = pageWidth - (margin * 2);
    const boxHeight = 40;
    
    // Box de fundo - azul da marca
    doc.setFillColor(0, 28, 84);
    doc.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3, 'F');
    
    // Borda amarela
    doc.setDrawColor(255, 152, 0);
    doc.setLineWidth(1);
    doc.roundedRect(margin, boxY, boxWidth, boxHeight, 3, 3);
    
    // Título do resumo - branco
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RESUMO EXECUTIVO', margin + 5, boxY + 7);
    
    // Linha separadora amarela
    doc.setLineWidth(0.3);
    doc.setDrawColor(255, 152, 0);
    doc.line(margin + 5, boxY + 11, margin + boxWidth - 5, boxY + 11);
    
    // Campos do resumo organizados em duas colunas
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    
    // Coluna esquerda
    doc.text('Investimento Total:', margin + 5, boxY + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(formatCurrency(totalInvestment), margin + 5, boxY + 23);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    doc.text('Saldo Final:', margin + 5, boxY + 29);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 152, 0);
    doc.text(formatCurrency(finalCash), margin + 5, boxY + 35);
    
    // Coluna direita
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    doc.text('Rentabilidade Mensal:', margin + 120, boxY + 17);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(formatPercentage(roi), margin + 120, boxY + 23);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(240, 240, 240);
    doc.text('Payback:', margin + 120, boxY + 29);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(paybackPeriod > 0 ? `${paybackPeriod} meses` : 'Não alcançado', margin + 120, boxY + 35);
    
    // Separador
    doc.setLineWidth(0.3);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, 87, pageWidth - margin, 87);
    
    // Agrupar dados por ano (5 anos)
    const dataByYear: { [key: number]: typeof monthlyResults } = {};
    monthlyResults.forEach(result => {
      const year = Math.floor((result.month - 1) / 12) + 1;
      if (!dataByYear[year]) {
        dataByYear[year] = [];
      }
      dataByYear[year].push(result);
    });
    
    // Para cada ano
    Object.entries(dataByYear).forEach(([yearNum, months]) => {
      const year = parseInt(yearNum);
      
      // Adicionar nova página para cada ano (incluindo o primeiro)
      doc.addPage();
      
      // Fundo branco
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
      
      // Header do ano com fundo azul
      let yPos = 25;
      
      // Definir posições uniformes para todas as barras e linhas
      const tableStartX = margin + 10;
      const tableEndX = pageWidth - margin - 10;
      const barStartX = tableStartX - 10;
      const barWidth = tableEndX - barStartX;
      
      // Fundo azul para o cabeçalho
      const headerHeight = 20;
      doc.setFillColor(0, 28, 84);
      doc.roundedRect(0, yPos - 15, pageWidth, headerHeight, 0, 0, 'F');
      
      // Barra decorativa acima do título - amarelo da marca com efeito moderno
      // Sombra sutil (subida ~3mm)
      doc.setFillColor(200, 120, 0);
      doc.roundedRect(barStartX, yPos - 4, barWidth, 3, 1, 1, 'F');
      // Barra principal (subida ~3mm)
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(barStartX, yPos - 5, barWidth, 3, 1, 1, 'F');
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(`Ano ${year}`, margin + 5, yPos + 6);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(240, 240, 240);
      doc.text(`(Meses ${(year-1)*12 + 1} a ${year*12})`, margin + 30, yPos + 6);
      
      yPos += 15;
      
      // Totais do ano
      const yearTotals = {
        totalRevenue: months.reduce((sum, m) => sum + m.totalRevenue, 0),
        totalNetRevenue: months.reduce((sum, m) => sum + m.netRevenue, 0),
        totalNetProfit: months.reduce((sum, m) => sum + m.netProfit, 0),
        endCash: months[months.length - 1].cumulativeCash,
        endStores: months[months.length - 1].stores
      };
      
      // Box de resumo do ano com design mais moderno
      const boxHeight = 19;
      
      // Box principal - fundo branco com borda azul
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(barStartX, yPos, barWidth, boxHeight, 3, 3, 'F');
      
      // Borda azul
      doc.setDrawColor(0, 28, 84);
      doc.setLineWidth(1);
      doc.roundedRect(barStartX, yPos, barWidth, boxHeight, 3, 3);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      
      // Primeira linha - Receita Bruta Total
      doc.text(`Receita Bruta Total:`, barStartX + 8, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 28, 84);
      doc.text(formatCurrency(yearTotals.totalRevenue), barStartX + 65, yPos + 6);
      
      // Primeira linha - Lucro Líquido Total
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Lucro Líquido Total:`, barStartX + 135, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 152, 0);
      doc.text(formatCurrency(yearTotals.totalNetProfit), barStartX + 215, yPos + 6);
      
      // Segunda linha do box - Lojas
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Lojas ao final do ano:`, barStartX + 8, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 28, 84);
      doc.text(yearTotals.endStores.toString(), barStartX + 65, yPos + 6);
      
      // Segunda linha - Saldo Acumulado
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text(`Saldo Acumulado:`, barStartX + 135, yPos + 6);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(yearTotals.endCash >= 0 ? 28 : 220, yearTotals.endCash >= 0 ? 153 : 0, yearTotals.endCash >= 0 ? 84 : 0);
      doc.text(formatCurrency(yearTotals.endCash), barStartX + 215, yPos + 6);
      
      yPos += 20;
      
      // Tabela mensal do ano - design moderno com linhas
      let xPos = tableStartX;
      
      // Título da tabela (subido 3mm)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 28, 84);
      doc.text('Detalhamento Mensal', barStartX, yPos - 3);
      yPos += 6;
      
      // Barra amarela contínua em cima de todos os cabeçalhos - amarelo da marca com efeito moderno
      // Sombra sutil (subida 3mm)
      doc.setFillColor(200, 120, 0);
      doc.roundedRect(barStartX, yPos - 6, barWidth, 7, 1, 1, 'F');
      // Barra principal (subida 3mm)
      doc.setFillColor(255, 193, 7);
      doc.roundedRect(barStartX, yPos - 7, barWidth, 7, 1, 1, 'F');
      
      // Cabeçalhos individuais em branco sobre a barra amarela (subidos 3mm)
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      
      doc.text('Mês', xPos, yPos - 3);
      
      xPos += 25;
      doc.text('Rec. Bruta', xPos, yPos - 3);
      
      xPos += 55;
      doc.text('Rec. Líq.', xPos, yPos - 3);
      
      xPos += 55;
      doc.text('Lucro Líq.', xPos, yPos - 3);
      
      xPos += 55;
      doc.text('Saldo Final', xPos, yPos - 3);
      
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      // Dados mensais com linhas de grade
      
      months.forEach((month, index) => {
        if (yPos > pageHeight - 10) {
          doc.addPage();
          
          // Fundo branco
          doc.setFillColor(255, 255, 255);
          doc.rect(0, 0, pageWidth, pageHeight, 'F');
          
          yPos = 25;
          
          // Recriar título (subido 3mm)
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 28, 84);
          doc.text('Detalhamento Mensal', barStartX, yPos - 3);
          yPos += 6;
          
          // Recriar barra amarela contínua - amarelo da marca com efeito moderno
          // Sombra sutil (subida 3mm)
          doc.setFillColor(200, 120, 0);
          doc.roundedRect(barStartX, yPos - 6, barWidth, 7, 1, 1, 'F');
          // Barra principal (subida 3mm)
          doc.setFillColor(255, 193, 7);
          doc.roundedRect(barStartX, yPos - 7, barWidth, 7, 1, 1, 'F');
          
          // Recriar headers (subidos 3mm)
          xPos = tableStartX;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(255, 255, 255);
          
          doc.text('Mês', xPos, yPos - 3);
          xPos += 25;
          doc.text('Rec. Bruta', xPos, yPos - 3);
          xPos += 55;
          doc.text('Rec. Líq.', xPos, yPos - 3);
          xPos += 55;
          doc.text('Lucro Líq.', xPos, yPos - 3);
          xPos += 55;
          doc.text('Saldo Final', xPos, yPos - 3);
          yPos += 6;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
        }
        
        // Linha horizontal para separar dados - totalmente alinhada
        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(barStartX, yPos + 2, tableEndX, yPos + 2);
        
        // Dados - todos em cor escura
        xPos = tableStartX;
        doc.setTextColor(50, 50, 50);
        doc.text(month.month.toString(), xPos, yPos);
        
        xPos += 25;
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(month.totalRevenue), xPos, yPos);
        
        xPos += 55;
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(month.netRevenue), xPos, yPos);
        
        xPos += 55;
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(month.netProfit), xPos, yPos);
        
        xPos += 55;
        doc.setTextColor(50, 50, 50);
        doc.text(formatCurrency(month.cumulativeCash), xPos, yPos);
        
        yPos += 5;
      });
    });
    
    doc.save(`BeHonest_Simulacao_Completa_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const chartData = monthlyResults.map(result => ({
    mes: result.month,
    fluxoCaixa: result.cumulativeCash,
    fluxoCaixaPositivo: result.cumulativeCash >= 0 ? result.cumulativeCash : null,
    fluxoCaixaNegativo: result.cumulativeCash < 0 ? result.cumulativeCash : null,
    isFirstMonth: result.month === 1,
    isSecondMonth: result.month === 2
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
            <h4>Rentabilidade Mensal</h4>
            <p className="summary-value positive">{formatPercentage(roi)}</p>
            <span className="card-period">Média</span>
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

      {/* Comparação com Investimentos */}
      <div style={{ marginTop: '30px', marginBottom: '30px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '20px',
          textAlign: 'center',
          color: 'white'
        }}>
          Comparação com Investimentos em Renda Fixa
        </h2>
        <InvestmentComparisonChart 
          franchiseResults={results}
          initialInvestment={results.totalInvestment}
        />
      </div>

      <div className="detailed-breakdown">
        <h4>Último Mês (Mês {lastMonth.month})</h4>
        <div className="detailed-breakdown-grid" style={{ alignItems: 'start' }}>
          {/* Coluna Esquerda - Receitas e Lucros */}
          <div className="breakdown-grid" style={{ 
            backgroundColor: '#f1f8e9', 
            padding: '15px', 
            borderRadius: '10px',
            border: '2px solid #81c784'
          }}>
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
            <div className="breakdown-item" style={{ backgroundColor: '#e8f5e9', padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '700', color: '#2e7d32' }}>Receita Líquida:</span>
              <span style={{ fontWeight: '700', color: '#2e7d32', fontSize: '16px' }}>{formatCurrency(lastMonth.netRevenue)}</span>
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

          {/* Coluna Direita - Todas as Despesas */}
          <div className="breakdown-grid" style={{ 
            backgroundColor: '#ffebee', 
            padding: '15px', 
            borderRadius: '10px',
            border: '2px solid #ef5350'
          }}>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Imposto:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.tax)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Custo 1:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.cmv)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Custo 2:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.losses)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Despesa 1:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.reposicao)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Despesa 2:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.royalties)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Despesa 3:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.otherRepasses)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Taxa de Cartão:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.cardFee)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Marketing:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.marketing)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Sistema:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.systemFee)}</span>
            </div>
            <div className="breakdown-item" style={{ padding: '10px', borderRadius: '6px' }}>
              <span style={{ fontWeight: '600', color: '#c62828' }}>Contabilidade:</span>
              <span style={{ fontWeight: '600', color: '#c62828' }}>{formatCurrency(-lastMonth.accounting)}</span>
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
          <h4>Fluxo de Caixa Acumulado</h4>
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'Saldo Acumulado (Positivo)' || name === 'Saldo Acumulado (Negativo)') {
                    let note = '';
                    if (props.payload.mes === 1) {
                      note = ' (Taxa de Franquia: -R$ 30.000)';
                    } else if (props.payload.mes === 2) {
                      note = ' (Implementação 1ª Loja: -R$ 20.000)';
                    }
                    return [formatCurrency(value as number) + note, 'Saldo Acumulado'];
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
              {/* Informações Gerais */}
              <tr>
                <td><strong>Lojas</strong></td>
                {monthlyResults.map((result) => (
                  <td key={result.month}>{result.stores}</td>
                ))}
              </tr>
              
              {/* Receitas e Lucros */}
              <tr>
                <td><strong>Receita Bruta</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(result.totalRevenue)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Receita Líquida</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(result.netRevenue)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Lucro Bruto</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(result.grossProfit)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Lucro Líquido</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(result.netProfit)}</td>
                ))}
              </tr>
              
              {/* Todas as Despesas Agrupadas */}
              <tr>
                <td><strong>Imposto</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.tax)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Custo 1</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.cmv)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Custo 2</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.losses)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Despesa 1</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.reposicao)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Despesa 2</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.royalties)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Despesa 3</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.otherRepasses)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Taxa de Cartão</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.cardFee)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Marketing</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.marketing)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Sistema</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.systemFee)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Contabilidade</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.accounting)}</td>
                ))}
              </tr>
              <tr>
                <td><strong>Custos Fixos</strong></td>
                {monthlyResults.map((result) => (
                  <td>{formatCurrency(-result.fixedCosts)}</td>
                ))}
              </tr>
              
              {/* Saldo Acumulado */}
              <tr>
                <td><strong>Saldo Acumulado</strong></td>
                {monthlyResults.map((result) => (
                  <td 
                    key={result.month}
                    className={result.cumulativeCash >= 0 ? 'positive' : 'negative'}
                    style={{ position: 'relative' }}
                  >
                    <div>{formatCurrency(result.cumulativeCash)}</div>
                    {result.month === 1 && (
                      <div style={{ fontSize: '10px', color: '#ff9800', fontWeight: '600', marginTop: '2px' }}>
                        ⚠️ Taxa de Franquia: -R$ 30.000
                      </div>
                    )}
                    {result.month === 2 && (
                      <div style={{ fontSize: '10px', color: '#ff9800', fontWeight: '600', marginTop: '2px' }}>
                        ⚠️ Implementação 1ª Loja: -R$ 20.000
                      </div>
                    )}
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
                onClick={() => window.open('https://wa.me/5531983550409', '_blank')}
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
