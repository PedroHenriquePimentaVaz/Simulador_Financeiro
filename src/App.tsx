import { useState } from 'react';
import { SimulationData } from './types/simulation';
import { simulate as advancedSimulate, SimulationResult as AdvancedSimulationResult } from './utils/advancedCalculations';
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
        60
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
            <div className="hero-brand-name">BeHonest</div>
          </div>

          {/* Main Content Grid */}
          <div className="hero-main-grid">
            {/* Left Side - Headlines and Stats */}
            <div className="hero-left">
              <div className="hero-headline">
                <h1 className="main-title">
                  <span className="highlight-text">ROI de 280%</span> em 5 anos
                  <br />
                  <span className="subtitle">Payback em apenas 20 meses</span>
                </h1>
                
                <div className="hero-stats">
                  <div className="stat-card">
                    <div className="stat-number">280%</div>
                    <div className="stat-label">ROI Médio</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">20</div>
                    <div className="stat-label">Meses Payback</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">15%</div>
                    <div className="stat-label">Margem Líquida</div>
                  </div>
                </div>
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
