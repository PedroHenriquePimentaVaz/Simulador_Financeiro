import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-logo-section">
          <div className="footer-logo">
            <img src="/behonest-logo.png" alt="BeHonest Logo" className="footer-logo-img" />
            <span className="footer-brand">BE HONEST</span>
          </div>
          
          <div className="footer-social">
            <a href="https://www.instagram.com/behonestbrasil/" target="_blank" rel="noopener noreferrer">
              <img src="/instagram.png" alt="Instagram" />
            </a>
            <a href="https://www.facebook.com/behonestbrasil/" target="_blank" rel="noopener noreferrer">
              <img src="/facebook.png" alt="Facebook" />
            </a>
            <a href="https://www.linkedin.com/company/behonestbrasil/" target="_blank" rel="noopener noreferrer">
              <img src="/linkedin.png" alt="LinkedIn" />
            </a>
            <a href="https://www.youtube.com/@behonestbrasil" target="_blank" rel="noopener noreferrer">
              <img src="/youtube.png" alt="YouTube" />
            </a>
            <a href="https://www.tiktok.com/@behonestbrasil" target="_blank" rel="noopener noreferrer">
              <img src="/tiktok.png" alt="TikTok" />
            </a>
          </div>
          
          <div className="footer-abf">
            <img src="/abf.png" alt="ABF - Associação Brasileira de Franchising" />
          </div>
        </div>
        
        <div className="footer-menu">
          <h3>Menu</h3>
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#condominio">Quero no meu condomínio!</a></li>
            <li><a href="#franqueado">Quero ser franqueado!</a></li>
          </ul>
        </div>
        
        <div className="footer-download">
          <h3>Download App</h3>
          <p>Com o App Be Honest você terá ainda mais comodidade.</p>
          <div className="download-links">
            <a href="https://play.google.com/store/apps/details?id=com.behonest.app" target="_blank" rel="noopener noreferrer">
              <img src="/googleplay.png" alt="DISPONÍVEL NO Google Play" />
            </a>
            <a href="https://apps.apple.com/br/app/be-honest/id6479310479" target="_blank" rel="noopener noreferrer">
              <img src="/appstore.png" alt="Disponível na App Store" />
            </a>
          </div>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-copyright">
          <p>Copyright © 2025 - Be Honest</p>
        </div>
        <div className="footer-privacy">
          <a href="https://behonestbrasil.com.br/politica-de-privacidade/">Política de Privacidade</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

