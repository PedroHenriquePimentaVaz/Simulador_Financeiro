import { AdvancedSimulationResult } from '../utils/advancedCalculations';
import AdvancedResultsDisplay from '../components/AdvancedResultsDisplay';
import Footer from '../components/Footer';
import WhatsAppPopUp from '../components/WhatsAppPopUp';

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
      <div 
        className="results-hero-section"
        style={{
          background: '#ffffff',
          color: '#001c54',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(0, 28, 84, 0.12)'
        }}
      >
        <div className="results-hero-content" style={{ position: 'relative', zIndex: 1 }}>
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
                onClick={() => window.open('https://wa.me/5531983550409', '_blank')}
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
              Sua franquia Be Honest está projetada para gerar excelentes resultados
            </p>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 14px',
              borderRadius: '30px',
              backgroundColor: 'rgba(255, 193, 7, 0.15)',
              color: '#ffe08a',
              fontWeight: 700,
              letterSpacing: '0.5px',
              marginTop: '10px'
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#ffc107',
                boxShadow: '0 0 0 4px rgba(255,193,7,0.2)'
              }} />
              Resultados oficiais Be Honest
            </div>
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
        </div>
      </div>
      <Footer />
      
      {/* WhatsApp PopUp */}
      <WhatsAppPopUp whatsappLink="https://chat.whatsapp.com/KOKk46ZMmjMEZjvScFOf2f" />
    </div>
  );
};

export default ResultsPage;

