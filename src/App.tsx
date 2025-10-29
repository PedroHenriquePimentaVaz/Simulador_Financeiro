import { useState } from 'react';
import { SimulationData } from './types/simulation';
import { simulate as advancedSimulate, AdvancedSimulationResult } from './utils/advancedCalculations';
import SimulationForm from './components/SimulationForm';
import ResultsPage from './pages/ResultsPage';
import Footer from './components/Footer';

function App() {
  const [simulationData, setSimulationData] = useState<SimulationData>({
    investimentoInicial: 70000,
    faturamentoMensal: 15000,
    margemLiquida: 12,
    despesasFixas: 2000,
    despesasVariaveis: 1000,
    periodoSimulacao: 60,
    lucroDesejado: 2000,
    perfilOperacao: 'gestao'
  });

  const [advancedResults, setAdvancedResults] = useState<AdvancedSimulationResult | null>(null);
  const [currentResults, setCurrentResults] = useState<AdvancedSimulationResult | null>(null);
  const [showResults, setShowResults] = useState(false);

  const handleSimulation = (data: SimulationData) => {
    setSimulationData(data);
    
    try {
      // Simular usando o modelo avançado (5 anos = 60 meses)
      const result = advancedSimulate(
        data.lucroDesejado || 2000,
        data.investimentoInicial,
        data.perfilOperacao || 'gestao',
        60,
        data.cenario || 'medio'
      );
      
      setAdvancedResults(result);
      setCurrentResults(result);
      setShowResults(true);
    } catch (error) {
      console.error('Error during simulation:', error);
    }
  };

  const handleResultsUpdate = (newResults: AdvancedSimulationResult) => {
    setCurrentResults(newResults);
  };

  if (showResults && advancedResults && currentResults) {
    return (
      <ResultsPage 
        results={advancedResults}
        currentResults={currentResults}
        lucroDesejado={simulationData.lucroDesejado}
        onNewSimulation={() => {
          setShowResults(false);
          setAdvancedResults(null);
          setCurrentResults(null);
        }}
        onResultsUpdate={handleResultsUpdate}
      />
    );
  }

  return (
    <div className="app-container">
      {/* Hero Section - Landing Page Otimizada */}
      <div className="hero-section">
        <div className="hero-content">
          {/* Logo e Brand */}
          <div className="hero-logo-container" style={{ cursor: 'pointer' }} onClick={() => window.location.reload()}>
            <img src="/behonest-logo.png" alt="BeHonest Logo" className="hero-logo" />
            <div className="hero-brand-name">Be <span>Honest</span></div>
          </div>

          {/* Main Content Grid */}
          <div className="hero-main-grid">
            {/* Left Side - Headlines and Stats */}
            <div className="hero-left">
              <div className="hero-headline">
                <h1 className="main-title">
                  Simule qual seria seu Lucro investimento na franquia de mercados autônomos da <span className="highlight-text">Be Honest</span>
                </h1>
                
                <div className="hero-stats">
                  <div className="stat-card">
                    <div className="stat-number">⚡</div>
                    <div className="stat-label">100% Automatizado</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">📈</div>
                    <div className="stat-label">Alto Potencial de Crescimento</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">🤝</div>
                    <div className="stat-label">Suporte Completo</div>
                  </div>
                </div>
              </div>

              {/* Aviso sobre estimativas */}
              <div style={{
                marginTop: '25px',
                padding: '15px 20px',
                backgroundColor: 'rgba(255, 193, 7, 0.1)',
                border: '2px solid rgba(255, 193, 7, 0.3)',
                borderRadius: '8px',
                fontSize: '13px',
                color: '#ffc107',
                lineHeight: '1.6'
              }}>
                <strong style={{ fontSize: '14px' }}>⚠️ Importante:</strong>
                <p style={{ margin: '8px 0 0 0', color: '#fff8dc' }}>
                  Os valores são estimativas baseadas em médias do mercado. Os resultados reais podem variar.
                </p>
              </div>

              {/* Social Proof */}
              <div className="social-proof">
                  <div className="proof-text">
                    <span className="proof-icon">⭐</span>
                    <span>Operação <strong>100% automatizada</strong> sem funcionários</span>
                  </div>
                  <div className="proof-text">
                    <span className="proof-icon">🏆</span>
                    <span><strong>Franquia #1</strong> em crescimento no Brasil</span>
                  </div>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="hero-right">
              <div className="hero-form-container">
                <div className="hero-form-header">
                  <h2 className="hero-form-title">
                    Simule seu investimento em <span className="highlight">2 minutos</span>
                  </h2>
                  <p className="hero-form-subtitle">
                    Descubra quanto você pode ganhar
                  </p>
                </div>
                
                <SimulationForm 
                  initialData={simulationData}
                  onSimulate={handleSimulation}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="benefits-section">
        <div className="benefits-content">
          <h3 className="benefits-title">Por que investir na BeHonest?</h3>
          <div className="benefits-grid">
            <div className="benefit-item">
              <div className="benefit-icon">💰</div>
              <div className="benefit-content">
                <h4>Alta Rentabilidade</h4>
                <p>12% a 15% de margem líquida mensal</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">⏰</div>
              <div className="benefit-content">
                <h4>Funcionamento 24/7</h4>
                <p>24 horas, 7 dias por semana</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">👥</div>
              <div className="benefit-content">
                <h4>Sem Funcionários</h4>
                <p>Operação totalmente automatizada</p>
              </div>
            </div>
            <div className="benefit-item">
              <div className="benefit-icon">📦</div>
              <div className="benefit-content">
                <h4>Sem Estoque</h4>
                <p>Sem custos fixos de armazenamento</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default App;
