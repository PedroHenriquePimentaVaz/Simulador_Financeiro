import React, { useState, useEffect } from 'react';

interface WhatsAppPopUpProps {
  whatsappLink: string;
}

const WhatsAppPopUp: React.FC<WhatsAppPopUpProps> = ({ whatsappLink }) => {
  const [showPopUp, setShowPopUp] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const hasDismissedPopup = localStorage.getItem('behonest_popup_dismissed');
    
    if (!hasDismissedPopup) {
      const timer = setTimeout(() => {
        setShowPopUp(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    // Salvar no localStorage que o usuário dispensou o pop-up
    localStorage.setItem('behonest_popup_dismissed', 'true');
    
    setIsClosing(true);
    setTimeout(() => {
      setShowPopUp(false);
      setIsClosing(false);
    }, 300);
  };

  const handleEnterGroup = () => {
    window.open(whatsappLink, '_blank');
    handleClose();
  };

  if (!showPopUp) return null;

  return (
    <div 
      className={`whatsapp-popup-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div 
        className={`whatsapp-popup ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          className="whatsapp-popup-close"
          onClick={handleClose}
          aria-label="Fechar"
        >
          ✕
        </button>
        
        <div className="whatsapp-popup-content">
          <div className="whatsapp-popup-icon">
            📱
          </div>
          
          <h3>Entre no Grupo Empreenda!</h3>
          
          <p>
            Se você está pensando em tomar a decisão certa, entre no grupo!
          </p>
          
          <button 
            className="whatsapp-popup-button"
            onClick={handleEnterGroup}
          >
            Entrar no Grupo
          </button>
          
          <button 
            className="whatsapp-popup-link"
            onClick={handleClose}
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppPopUp;

