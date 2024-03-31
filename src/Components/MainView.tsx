import React, { Component, useState, useEffect } from 'react'
import { ResultTableLocal } from './ResultTableLocal'
import { ResultTableGlobal } from './ResultTableGlobal'

import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth'
import { getDatabase, onValue, ref, set, update } from 'firebase/database'
import { VoteScreen } from './VoteScreen'
import { LandingPage } from './LandingPage'
import { ChooseVotingGroupPage } from './ChooseVotingGroupPage'

export type Profile = {
  displayName: string
  [key: string]: { groupName: string } | string
}

export type Countries = {
  [key: number]: string
}

export type Votes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string
    }
  }
}

export type UserVotes = {
  [key: number]: string
}

export type GroupVotes = {
  [key: string]: {
    [key: number]: string
  }
}

export type GlobalVotes = {
  [key: string]: GroupVotes
}

export const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

export const MainView = () => {
  const provider = new GoogleAuthProvider()
  const [groupName, setGroupName] = useState<string>('')
  const [activeGroupName, setActiveGroupName] = useState<string>('')
  const [countries, setCountries] = useState<Countries>([])
  const [profile, setProfile] = useState<Profile>({})
  const [activeVote, setActiveVote] = useState<string>('')
  const [uid, setUid] = useState<string>('')
  const [votes, setVotes] = useState({})
  const [castVotes, setCastVotes] = useState({})
  const [currentUserVotes, setCurrentUserVotes] = useState<UserVotes>([])
  const [currentGroupVotes, setCurrentGroupVotes] = useState<GroupVotes>([])
  const [globalVotes, setGlobalVotes] = useState({})

  const onChange = (value) => {
    setGroupName(value)
  }

  // USER PROFILE AND DATA
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

  // COUNTRIES
  useEffect(() => {
    console.log('trying to get countries. activeVote present: ', activeVote)

    if (!activeVote) return

    const db = getDatabase()
    const countriesRef = ref(db, `countries/${activeVote}`)
    const unsubscribe = onValue(countriesRef, (snapshot) => {
      const data = snapshot.val()
      setCountries(data)
    })

    return () => unsubscribe()
  }, [activeVote])

  // VOTES
  useEffect(() => {
    console.log('trying to get votes. activeVote present: ', activeVote)

    if (!activeVote) return

    const db = getDatabase()

    const votesRef = ref(db, `votes/${activeVote}`)
    const unsubscribe = onValue(votesRef, (snapshot) => {
      console.log('Updating votes!')
      const data = snapshot.val()
      setVotes(data)
      setCurrentUserVotes(data?.[activeGroupName]?.[profile.displayName])
      setCurrentGroupVotes(data?.[activeGroupName])
      setGlobalVotes(data)

      console.log('Votes: ', data)
      const castVotes =
        votes[activeVote]?.[activeGroupName]?.[profile.displayName]
      console.log('Setting cast votes: ', castVotes)
      setCastVotes(castVotes)
    })

    return () => unsubscribe()
  }, [activeVote, activeGroupName, profile])

  // ACTIVE VOTE
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
    console.log('Voting for ', points, country)
    let countryAlreadyHasVote = false
    let whichPointsAlreadyHadVote: string | null = null

    if (currentUserVotes) {
      Object.entries(currentUserVotes).forEach(([points, country]) => {
        if (country === country) {
          countryAlreadyHasVote = true
          whichPointsAlreadyHadVote = points
        }
      })
    }

    const db = getDatabase()

    if (countryAlreadyHasVote) {
      console.log('Updating vote')
      console.log({
        [points]: country,
        [whichPointsAlreadyHadVote!]: null,
      })
      update(
        ref(
          db,
          `votes/${activeVote}/${activeGroupName}/${profile.displayName}`,
        ),
        {
          [points]: country,
          [whichPointsAlreadyHadVote!]: null,
        },
      )
    } else {
      console.log('Adding new vote')
      update(
        ref(
          db,
          `votes/${activeVote}/${activeGroupName}/${profile.displayName}`,
        ),
        {
          [points]: country,
        },
      )
    }
  }

  console.log('currentUserVotes: ', currentUserVotes)
  console.log('currentGroupVotes: ', currentGroupVotes)
  console.log('globalVotes: ', globalVotes)
  console.log('countries: ', countries)

  const auth = getAuth()
  const currentUser = auth.currentUser

  const showLoading = !countries || !currentUser || !activeVote
  const showLogin = countries && !currentUser
  const showJoinGroup =
    countries && currentUser && activeVote && !activeGroupName
  const showVoting = countries && uid && activeGroupName && activeVote

  return (
    <div>
      {showLoading && (
        <h1 className="title has-text-centered ">
          <br />
          <br />
          <button className="button is-success is-loading">Loading</button>
        </h1>
      )}
      {!showLoading && showLogin && <LandingPage loginGoogle={loginGoogle} />}
      {!showLoading && showJoinGroup && (
        <ChooseVotingGroupPage
          setGroupName={onChange}
          onSubmitGroupName={onSubmitGroupName}
        />
      )}
      {!showLoading && showVoting && (
        <>
          <div className="section">
            <VoteScreen
              countries={countries}
              currentUserVotes={currentUserVotes}
              vote={vote}
              activeVote={activeVote}
              activeGroupName={activeGroupName}
            />
          </div>
          <div className="section is-align-self-center">
            <div className="columns">
              <ResultTableLocal
                countries={countries}
                currentGroupVotes={currentGroupVotes}
                groupName={activeGroupName}
                activeVote={activeVote}
              />
              <hr className="is-hidden-desktop" />
              <ResultTableGlobal
                countries={countries}
                globalVotes={globalVotes}
                activeVote={activeVote}
              />
            </div>
          </div>
        </>
      )}
      {!showLoading && (
        <>
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
        </>
      )}
    </div>
  )
}
