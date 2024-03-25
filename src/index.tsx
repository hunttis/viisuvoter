import React from 'react'
import { render } from 'react-dom'
import { initializeApp } from 'firebase/app'
import { MainView } from './Components/MainView.jsx'
import { createRoot } from 'react-dom/client'

import 'firebase/compat/database'
import 'bulma/css/bulma.css'
import './mystyle.css'

import { firebaseConfig } from '../config.js'

const container = document.getElementById('root')

const App = () => {
  const firebaseApp = initializeApp(firebaseConfig)

  return (
    <div className="App">
      <MainView />
    </div>
  )
}

if (container) {
  const root = createRoot(container)

  root.render(<App />)
} else {
  throw new Error(
    "Root element with ID 'root' was not found in the document. Ensure there is a corresponding HTML element with the ID 'root' in your HTML file.",
  )
}
