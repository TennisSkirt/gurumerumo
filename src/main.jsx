import React from 'react'
import ReactDOM from 'react-dom/client'
import { APIProvider } from '@vis.gl/react-google-maps'
import App from './App.jsx'
import { PlacesProvider } from './store/PlacesContext.jsx'
import { GOOGLE_KEY } from './lib/google.js'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlacesProvider>
      <APIProvider apiKey={GOOGLE_KEY} language="ko" region="KR">
        <App />
      </APIProvider>
    </PlacesProvider>
  </React.StrictMode>,
)
