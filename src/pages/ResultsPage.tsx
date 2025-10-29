import { AdvancedSimulationResult } from '../utils/advancedCalculations';
import AdvancedResultsDisplay from '../components/AdvancedResultsDisplay';
import InvestmentComparisonChart from '../components/InvestmentComparisonChart';
import Footer from '../components/Footer';

interface ResultsPageProps {
  results: AdvancedSimulationResult;
  currentResults: AdvancedSimulationResult;
  lucroDesejado?: number;
  onNewSimulation: () => void;
  onResultsUpdate?: (newResults: AdvancedSimulationResult) => void;
}

const ResultsPage: React.FC<ResultsPageProps> = ({ results, currentResults, lucroDesejado, onNewSimulation, onResultsUpdate }) => {
  return (
    <div className="app-container">
      {/* Hero Results Section */}
      <div className="results-hero-section">
        <div className="results-hero-content">
          {/* Header com Logo e Actions */}
          <div className="results-header">
            <div className="results-logo-container" style={{ cursor: 'pointer' }} onClick={onNewSimulation}>
              <img src="/behonest-logo.png" alt="BeHonest Logo" className="results-logo" />
              <div className="results-brand-name">Be <span>Honest</span></div>
            </div>
            
            <div className="results-actions">
              <button 
                className="results-action-btn secondary"
                onClick={onNewSimulation}
              >
                🔄 Nova Simulação
              </button>
              <button 
                className="results-action-btn primary"
                onClick={() => window.open('https://chat.whatsapp.com/KOKk46ZMmjMEZjvScFOf2f', '_blank')}
              >
                💬 Falar com Especialista
              </button>
            </div>
          </div>

          {/* Success Message */}
          <div className="results-success-message">
            <div className="success-icon">🎉</div>
            <h1 className="success-title">Simulação Concluída com Sucesso!</h1>
            <p className="success-subtitle">
              Sua franquia BeHonest está projetada para gerar excelentes resultados
            </p>
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="results-page-container" style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 20px'
        }}>
          
          <AdvancedResultsDisplay 
            results={results}
            currentResults={currentResults}
            lucroDesejado={lucroDesejado}
            onResultsUpdate={onResultsUpdate}
          />
          
          <div style={{ marginTop: '40px' }}>
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
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResultsPage;

