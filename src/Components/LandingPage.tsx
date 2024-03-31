import React from 'react'

export const LandingPage = ({ loginGoogle }) => (
  <div className="level">
    <div className="level-item">
      <button className="button is-success is-outlined" onClick={loginGoogle}>
        Google Login
      </button>
    </div>
  </div>
)
