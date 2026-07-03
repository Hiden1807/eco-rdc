// =============================================================
// src/main.jsx — Point d'entrée de l'application React
// Monte l'application dans le DOM et charge les styles globaux
// =============================================================
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css' // Styles globaux de l'application

// Montage de l'application React dans la div #root de index.html
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
