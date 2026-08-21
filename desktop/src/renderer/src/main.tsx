import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import { BootGate } from './components/BootGate';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BootGate>
      <HashRouter>
        <App />
      </HashRouter>
    </BootGate>
  </StrictMode>,
);
