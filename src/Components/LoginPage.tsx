import { GoogleAuthProvider, getAuth, signInWithPopup } from 'firebase/auth'
import React from 'react'

type LoginPageProps = {
  authProvider: GoogleAuthProvider
  setProfile: (Profile) => void
}

export const LoginPage = ({ authProvider, setProfile }: LoginPageProps) => {
  const loginGoogle = async () => {
    const auth = getAuth()

    signInWithPopup(auth, authProvider)
      .then((result) => {
        console.log('LOGIN: ', result)
        const credential = GoogleAuthProvider.credentialFromResult(result)
        const token = credential?.accessToken
        const user = result.user
        setProfile(user)
        console.log('USER: ', user)
      })
      .catch((error) => {
        const errorCode = error.code
        const errorMessage = error.message
        const email = error.customData.email
        const credential = GoogleAuthProvider.credentialFromError(error)
      })
  }
  return (
    <>
      <section class="hero is-primary">
        <div class="hero-body">
          <p class="title has-text-centered">Viisuvoter</p>
        </div>
      </section>
      <div className="section">
        <div className="level">
          <div className="level-item">
            <button
              className="button is-success is-outlined"
              onClick={loginGoogle}
            >
              Google Login
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
