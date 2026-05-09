import { getAuth, signOut } from 'firebase/auth'
import { Profile, VoteProfile } from './Models'

interface UserOptionsProps {
  uid: string
  activeVote: string
  setActiveGroupName: (name: string) => void
  profile: Profile
}

export const UserOptions = ({
  activeVote,
  setActiveGroupName,
  profile,
}: UserOptionsProps) => {
  const auth = getAuth()
  const profileByEvent = profile as unknown as Record<string, VoteProfile | undefined>
  const userGroups = profileByEvent[activeVote]?.groupNames || []

  return (
    <div className="navbar is-light">
      <div className="navbar-brand">
        <div className="navbar-item">
          <div className="field">
            <div className="control">
              <div className="select">
                <select
                  value={profileByEvent[activeVote]?.groupNames?.[0] || ''}
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
