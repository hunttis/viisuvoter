import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'
import React from 'react'

type LoginPageProps = {
  onLogin: () => Promise<void>
}

export const LoginPage = ({ onLogin }: LoginPageProps) => {
  return (
    <>
      <section className="hero is-primary">
        <div className="hero-body">
          <p className="title has-text-centered">Viisuvoter</p>
        </div>
      </section>
      <div className="section">
        <div className="level">
          <div className="level-item">
            <button className="button is-success is-outlined" onClick={onLogin}>
              Google Login
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
