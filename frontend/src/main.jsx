import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';

import './styles/excel.css';
import './styles/modern.css';
import './styles/webapp.css';
import './styles/wizard.css';
import './styles/onboarding.css';
import './styles/messages.css';
import './styles/demo-windows.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
