import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles.css'
import WorkspaceApp from './bionis/app-shell'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WorkspaceApp />
  </React.StrictMode>,
)
