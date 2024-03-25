import React, { Component, useState, useEffect } from 'react'
import { ResultTableLocal } from './ResultTableLocal'
import { ResultTableGlobal } from './ResultTableGlobal'

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth'
import { getDatabase, onValue, ref, set } from 'firebase/database'
import { VoteScreen } from './VoteScreen'

export type Profile = {
  displayName: string
  [key: string]: { groupName: string } | string
}

export type Countries = {
  [key: string]: [string, string]
}

export type Votes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string
    }
  }
}

export const MainView = () => {
  const provider = new GoogleAuthProvider()
  const [groupName, setGroupName] = useState<string>('')
  const [activeGroupName, setActiveGroupName] = useState<string>('')
  const [countries, setCountries] = useState<Countries>({})
  const [profile, setProfile] = useState<Profile>({})
  const [activeVote, setActiveVote] = useState<string>('')
  const [uid, setUid] = useState<string>('')
  const [votes, setVotes] = useState({})

  const onChange = (value) => {
    setGroupName(value)
  }

  useEffect(() => {
    const auth = getAuth()

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User is signed in', user)

        const db = getDatabase()
        const userRef = ref(db, `users/${user.uid}`)
        onValue(userRef, (snapshot) => {
          const data = snapshot.val()
          console.log('User data: ', data)
          setProfile(data)
          setUid(user.uid)
          const votingGroup = data[activeVote]?.groupName
          setActiveGroupName(votingGroup)
        })
      } else {
        console.log('User is signed out')
        setProfile({})
      }
    })

    return () => unsubscribe()
  }, [activeVote])

  useEffect(() => {
    const db = getDatabase()
    const countriesRef = ref(db, 'countries')
    const unsubscribe = onValue(countriesRef, (snapshot) => {
      const data = snapshot.val()
      setCountries(data)
      console.log('Countries: ', data)
    })

    return () => unsubscribe()
  }, [activeVote])

  useEffect(() => {
    const db = getDatabase()
    const votesRef = ref(db, `votes/${activeVote}`)
    const unsubscribe = onValue(votesRef, (snapshot) => {
      const data = snapshot.val()
      setVotes(data)
      console.log('Votes: ', data)
    })

    return () => unsubscribe()
  }, [activeVote])

  useEffect(() => {
    const db = getDatabase()
    const activeVoteRef = ref(db, 'activeVote')
    const unsubscribe = onValue(activeVoteRef, (snapshot) => {
      const data = snapshot.val()
      setActiveVote(data)
      console.log('Active vote: ', data)
    })
    return () => unsubscribe()
  }, [])

  const loginGoogle = async () => {
    const auth = getAuth()

    signInWithPopup(auth, provider)
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

  const onSubmitGroupName = async () => {
    if (groupName) {
      const db = getDatabase()
      set(ref(db, `users/${uid}/${activeVote}/`), {
        groupName,
      })
      setActiveGroupName(groupName)
    }
  }

  const leaveVotingGroup = () => {
    const db = getDatabase()
    set(ref(db, `users/${uid}/${activeVote}/`), {
      groupName: null,
    })
    setActiveGroupName('')
  }

  const logout = () => {
    const auth = getAuth()
    auth.signOut()
    window.location.reload()
  }

  const vote = (points, country) => {
    let countryAlreadyHasVote = false
    let whichPointsAlreadyHadVote: string | null = null

    const votesForUser = votes
      ? votes[activeVote][groupName][profile.displayName]
      : {}

    for (const vote in votesForUser) {
      if (country === votesForUser[vote]) {
        countryAlreadyHasVote = true
        whichPointsAlreadyHadVote = vote
      }
    }
    const db = getDatabase()

    if (countryAlreadyHasVote) {
      // Update this code to be the same as above firebase set
      set(ref(db, `votes/${activeVote}/${groupName}/${profile.displayName}`), {
        [points]: country,
        [whichPointsAlreadyHadVote!]: null,
      })
    } else {
      set(ref(db, `votes/${activeVote}/${groupName}/${profile.displayName}`), {
        [points]: country,
      })
    }
  }

  const auth = getAuth()
  const currentUser = auth.currentUser

  const showLoading = !countries || !currentUser || !activeVote
  const showLogin = countries && !currentUser
  const showJoinGroup =
    countries && currentUser && activeVote && !activeGroupName
  const showJoinedGroup = countries && uid && activeGroupName

  const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]
  const castVotes = votes[activeVote]?.[groupName]?.[profile.displayName] || {}

  return (
    <div className="section">
      {showLoading && (
        <h1 className="title has-text-centered has-text-white">
          <br />
          <br />
          <button className="button is-success is-loading">Loading</button>
        </h1>
      )}
      {!showLoading && showLogin && (
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
      )}
      {showJoinGroup && (
        <div className="field is-horizontal">
          <div className="field-label">
            <label className="label has-text-white">Voting group</label>
          </div>
          <div className="field-body">
            <input
              className="input"
              onChange={(event) => setGroupName(event.target.value)}
            />
          </div>
          <div className="field-body">
            <button
              className="button is-info"
              onClick={() => onSubmitGroupName()}
            >
              Join
            </button>
            <button className="button is-warning" onClick={leaveVotingGroup}>
              Clear voting group
            </button>
          </div>
        </div>
      )}
      {showJoinedGroup && (
        <>
          <VoteScreen
            countries={countries}
            castVotes={castVotes}
            pointAmounts={pointAmounts}
            vote={vote}
          />
          <div className="columns">
            <ResultTableLocal
              profile={profile}
              countries={countries}
              votes={votes}
              groupName={activeGroupName}
            />
            <hr className="is-hidden-desktop" />
            <ResultTableGlobal
              countries={countries}
              votes={votes}
              activeVote={activeVote}
            />
          </div>
        </>
      )}

      <button
        className="button is-pulled-right is-warning is-outlined is-small"
        onClick={() => leaveVotingGroup()}
      >
        Leave voting group
      </button>
      <button
        className="button is-pulled-right is-danger is-outlined is-small"
        onClick={() => logout()}
      >
        Log out
      </button>
    </div>
  )
}
