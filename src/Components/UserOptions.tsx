import { getAuth } from 'firebase/auth'
import { getDatabase, ref, set } from 'firebase/database'
import React from 'react'

export const UserOptions = ({ uid, activeVote, setActiveGroupName }) => {
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

  return (
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
  )
}
