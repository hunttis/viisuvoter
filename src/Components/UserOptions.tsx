import React from 'react'
import { getAuth, signOut } from 'firebase/auth'
import { Profile } from './Models'

interface UserOptionsProps {
  uid: string
  activeVote: string
  setActiveGroupName: (name: string) => void
  profile: Profile
}

export const UserOptions = ({
  uid,
  activeVote,
  setActiveGroupName,
  profile,
}: UserOptionsProps) => {
  const auth = getAuth()
  const userGroups = profile[activeVote]?.groupNames || []

  return (
    <div className="navbar is-light">
      <div className="navbar-brand">
        <div className="navbar-item">
          <div className="field">
            <div className="control">
              <div className="select">
                <select
                  value={profile[activeVote]?.groupNames?.[0] || ''}
                  onChange={(e) => setActiveGroupName(e.target.value)}
                >
                  {userGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="navbar-end">
        <div className="navbar-item">
          <button className="button is-light" onClick={() => signOut(auth)}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
