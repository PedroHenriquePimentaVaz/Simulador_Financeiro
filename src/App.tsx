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
    perfilOperacao: 'proprio'
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
        data.perfilOperacao || 'proprio',
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
            <div className="hero-left-column">
            {/* Headline */}
            <div className="hero-headline-area">
              <div className="hero-headline">
                <h1 className="main-title">
                  Simule qual seria o lucro do seu investimento na franquia de mercados autônomos da <span className="highlight-text">Be Honest</span>
                  <br />
                  <span className="subtitle">Payback de 18 a 22 meses</span>
                </h1>
              </div>
            </div>

            {/* Supporting Content */}
            <div className="hero-support-area">
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

              <div className="hero-warning">
                <strong>⚠️ Importante:</strong>
                <p>
                  Os valores são estimativas baseadas em médias do mercado. Os resultados reais podem variar.
                </p>
              </div>

              <div className="social-proof">
                <div className="proof-text">
                  <span className="proof-icon">⭐</span>
                  <span>Operação <strong>100% automatizada</strong> sem funcionários</span>
                </div>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="hero-form-area">
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
          <h3 className="benefits-title">Por que investir na Be Honest?</h3>
          
          {/* First Row - Main Benefits */}
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

          {/* How It Works Section */}
          <div style={{ marginTop: '60px' }}>
            <h3 className="benefits-title">Como Funciona o Modelo de Negócio</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">🏪</div>
                <div className="benefit-content">
                  <h4>Estrutura Física</h4>
                  <p>Mercados autônomos instalados em locais estratégicos de alto tráfego</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">💳</div>
                <div className="benefit-content">
                  <h4>Vendas Automáticas</h4>
                  <p>Sistema integrado de pagamento e controle de estoque</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🔄</div>
                <div className="benefit-content">
                  <h4>Reposição Regular</h4>
                  <p>Operação de abastecimento feita de forma recorrente</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📊</div>
                <div className="benefit-content">
                  <h4>Gestão Remota</h4>
                  <p>Acompanhamento em tempo real via plataforma digital</p>
                </div>
              </div>
            </div>
          </div>

          {/* Advantages Section */}
          <div style={{ marginTop: '60px' }}>
            <h3 className="benefits-title">Vantagens Competitivas</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">⚡</div>
                <div className="benefit-content">
                  <h4>Payback Rápido</h4>
                  <p>Retorno do investimento em 18 a 22 meses</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🛡️</div>
                <div className="benefit-content">
                  <h4>Baixo Risco</h4>
                  <p>Modelo já validado e em expansão no mercado</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🎓</div>
                <div className="benefit-content">
                  <h4>Treinamento Completo</h4>
                  <p>Suporte total para sua jornada como franqueado</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📈</div>
                <div className="benefit-content">
                  <h4>Potencial de Crescimento</h4>
                  <p>Expansão ilimitada em uma indústria em crescimento</p>
                </div>
              </div>
            </div>
          </div>

          {/* Next Steps Section */}
          <div style={{ marginTop: '60px' }}>
            <h3 className="benefits-title">Próximos Passos Após a Simulação</h3>
            <div className="benefits-grid">
              <div className="benefit-item">
                <div className="benefit-icon">📞</div>
                <div className="benefit-content">
                  <h4>Entre em Contato</h4>
                  <p>Nossa equipe está pronta para esclarecer todas as suas dúvidas e apresentar o modelo completo</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">📋</div>
                <div className="benefit-content">
                  <h4>Receba Materiais</h4>
                  <p>Baixe apresentações, contratos e documentação completa sobre a franquia</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">🏢</div>
                <div className="benefit-content">
                  <h4>Visite uma Unidade</h4>
                  <p>Conheça pessoalmente uma loja em funcionamento para ver na prática como tudo funciona</p>
                </div>
              </div>
              <div className="benefit-item">
                <div className="benefit-icon">✍️</div>
                <div className="benefit-content">
                  <h4>Feche o Negócio</h4>
                  <p>Assine o contrato e inicie sua jornada como franqueado Be Honest com todo o suporte necessário</p>
                </div>
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
