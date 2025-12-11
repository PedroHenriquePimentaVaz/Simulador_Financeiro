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
  const brandBlue = '#001c54';
  const brandOrange = '#ff9d00';

  return (
    <div className="app-container" style={{ backgroundColor: '#f3f6fb' }}>
      {/* Hero Results Section */}
      <div 
        className="results-hero-section"
        style={{
          background: `linear-gradient(120deg, ${brandBlue} 0%, #0a2f7a 50%, #123d9d 100%)`,
          color: 'white',
          padding: '28px 0',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)'
        }}
      >
        <div className="results-hero-content" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          {/* Header com Logo e Actions */}
          <div className="results-header">
            <div className="results-logo-container" style={{ cursor: 'pointer' }} onClick={onNewSimulation}>
              <img src="/behonest-logo.png" alt="BeHonest Logo" className="results-logo" />
              <div className="results-brand-name">Be <span>Honest</span></div>
            </div>
            
            <div className="results-actions">
              <button 
                className="results-action-btn secondary"
                style={{
                  borderColor: 'white',
                  color: 'white',
                  backgroundColor: 'transparent',
                  boxShadow: '0 0 0 1px rgba(255,255,255,0.4)',
                  transition: 'all 0.2s ease'
                }}
                onClick={onNewSimulation}
              >
                🔄 Nova Simulação
              </button>
              <button 
                className="results-action-btn primary"
                style={{
                  backgroundColor: brandOrange,
                  borderColor: brandOrange,
                  color: brandBlue,
                  fontWeight: 800,
                  boxShadow: '0 8px 18px rgba(0,0,0,0.18)'
                }}
                onClick={() => window.open('https://wa.me/5531983550409', '_blank')}
              >
                💬 Falar com Especialista
              </button>
            </div>
          </div>

          {/* Success Message */}
          <div 
            className="results-success-message"
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
              borderRadius: '14px',
              padding: '22px',
              backdropFilter: 'blur(4px)',
              marginTop: '18px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
              <span style={{ background: 'rgba(255,255,255,0.2)', color: 'white', fontWeight: 800, padding: '6px 12px', borderRadius: '999px', letterSpacing: '0.4px' }}>
                BeHonest • Resultados
              </span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.2)' }} />
            </div>
            <div className="success-icon">🎉</div>
            <h1 className="success-title" style={{ color: 'white', textShadow: '0 4px 12px rgba(0,0,0,0.35)' }}>
              Simulação Concluída com Sucesso!
            </h1>
            <p className="success-subtitle" style={{ color: 'rgba(255,255,255,0.85)' }}>
              Sua franquia Be Honest está projetada para gerar excelentes resultados
            </p>
          </div>
        </div>
      </div>

      <div className="main-container">
        <div className="results-page-container" style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '40px 20px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f5f7fb 60%, #eef2f9 100%)',
          borderRadius: '14px',
          boxShadow: '0 18px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e5e9f2',
          marginTop: '-50px',
          position: 'relative',
          zIndex: 2
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

