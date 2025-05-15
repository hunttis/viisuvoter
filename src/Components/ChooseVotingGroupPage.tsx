import React, { useState, useEffect } from 'react'
import { getDatabase, ref, onValue } from 'firebase/database'
import { Profile } from './Models'

interface ChooseVotingGroupPageProps {
  setGroupName: (value: string) => void
  onSubmitGroupName: () => void
  uid: string
  profile: Profile | null
}

export const ChooseVotingGroupPage = ({
  setGroupName,
  onSubmitGroupName,
  uid,
  profile,
}: ChooseVotingGroupPageProps) => {
  const [existingGroups, setExistingGroups] = useState<string[]>([])
  const db = getDatabase()

  useEffect(() => {
    const groupsRef = ref(db, 'groups')
    const unsubscribe = onValue(groupsRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const groups = Object.keys(data)
        setExistingGroups(groups)
      }
    })
    return () => unsubscribe()
  }, [])

  const userGroups = profile?.groups?.groupNames
    ? Object.keys(profile.groups.groupNames)
    : []

  return (
    <div className="container">
      <div className="section">
        <h2 className="title is-4">Join a Voting Group</h2>
        <div className="field is-horizontal">
          <div className="field-label">
            <label className="label">New group name</label>
          </div>
          <div className="field-body">
            <input
              className="input"
              onChange={(event) => setGroupName(event.target.value)}
              placeholder="Enter new group name"
            />
          </div>
          <div className="field-body">
            <button
              className="button is-info"
              onClick={() => onSubmitGroupName()}
            >
              Create & Join
            </button>
          </div>
        </div>
      </div>

      <div className="section">
        <h2 className="title is-4">Existing Groups</h2>
        <div className="columns is-multiline">
          {existingGroups.map((group) => (
            <div key={group} className="column is-3">
              <div className="box">
                <h3 className="title is-5">{group}</h3>
                <button
                  className={`button is-fullwidth ${userGroups.includes(group) ? 'is-success' : 'is-primary'}`}
                  onClick={() => {
                    setGroupName(group)
                    onSubmitGroupName()
                  }}
                >
                  {userGroups.includes(group) ? 'Already Joined' : 'Join Group'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
