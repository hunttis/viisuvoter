import React, { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { Profile, VoteProfile, GroupVotes, GlobalVotes } from './Models'
import { ResultTableGlobal } from './ResultTableGlobal'
import { ResultTableLocal } from './ResultTableLocal'

type VoteScreenProps = {
  profile: Profile
  activeEvent: string
  activeGroupName: string
  setActiveGroupName: (name: string) => void
}

export const VoteScreen = ({
  profile,
  activeEvent,
  activeGroupName,
  setActiveGroupName,
}: VoteScreenProps) => {
  const [countries, setCountries] = useState<string[]>([])
  const [currentUserVotes, setCurrentUserVotes] = useState<
    Record<string, number>
  >({})
  const [votes, setVotes] = useState<any>({})
  const [groups, setGroups] = useState<any>({})
  const [users, setUsers] = useState<any>({})
  const [currentGroupVotes, setCurrentGroupVotes] = useState<GroupVotes>({})
  const [globalVotes, setGlobalVotes] = useState<GlobalVotes>({})

  // Load all data in parallel
  useEffect(() => {
    const db = getDatabase()
    const countriesRef = ref(db, `votingEvents/${activeEvent}/countries`)
    const votesRef = ref(db, `votes/${activeEvent}`)
    const groupsRef = ref(db, 'groups')
    const usersRef = ref(db, 'users')

    const unsubCountries = onValue(countriesRef, (snapshot) => {
      if (snapshot.exists()) setCountries(snapshot.val())
      else setCountries([])
    })
    const unsubVotes = onValue(votesRef, (snapshot) => {
      if (snapshot.exists()) setVotes(snapshot.val())
      else setVotes({})
    })
    const unsubGroups = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) setGroups(snapshot.val())
      else setGroups({})
    })
    const unsubUsers = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) setUsers(snapshot.val())
      else setUsers({})
    })
    return () => {
      unsubCountries()
      unsubVotes()
      unsubGroups()
      unsubUsers()
    }
  }, [activeEvent])

  // Compute group/global votes when all data is loaded
  useEffect(() => {
    if (Object.keys(groups).length > 0 && Object.keys(users).length > 0) {
      // Set current user's votes
      setCurrentUserVotes(votes[profile.uid] || {})

      // Calculate group votes
      const groupVotes: GroupVotes = {}
      const globalVotesData: GlobalVotes = {}
      // Map of group names to member IDs
      const groupMembers: Record<string, string[]> = {}
      Object.entries(groups).forEach(([groupId, groupData]: [string, any]) => {
        const groupName = groupData.name
        if (groupData.members) {
          groupMembers[groupName] = Object.keys(groupData.members)
        }
      })
      Object.entries(groupMembers).forEach(([groupName, memberIds]) => {
        groupVotes[groupName] = {}
        globalVotesData[groupName] = {}
        memberIds.forEach((userId) => {
          if (votes[userId]) {
            const userVotes = votes[userId] as Record<string, number>
            // Keep the original country-to-points mapping
            groupVotes[groupName][userId] = userVotes
            globalVotesData[groupName][userId] = userVotes
          }
        })
      })
      setCurrentGroupVotes(groupVotes)
      setGlobalVotes(globalVotesData)
    }
  }, [votes, groups, users, profile.uid])

  // Save votes when they change
  useEffect(() => {
    const db = getDatabase()
    const votesRef = ref(db, `votes/${activeEvent}/${profile.uid}`)

    // Only save if we have votes to save
    if (Object.keys(currentUserVotes).length > 0) {
      console.log('Saving votes:', currentUserVotes)
      set(votesRef, currentUserVotes)
    } else {
      // If we have no votes, check if there are existing votes in the database
      onValue(votesRef, (snapshot) => {
        if (snapshot.exists()) {
          // If there are existing votes, load them
          setCurrentUserVotes(snapshot.val())
        }
      })
    }
  }, [currentUserVotes, activeEvent, profile.uid])

  const userGroups = [
    ...(profile.groups?.groupNames
      ? Object.values(profile.groups.groupNames)
      : []),
    ...(profile['2024-final']?.groupNames || []),
    ...(profile.eurovision?.groupNames || []),
  ]

  return (
    <div className="container">
      <div className="level mb-4">
        <div className="level-left">
          <h2 className="title is-4">{activeEvent}</h2>
        </div>
        <div className="level-right">
          <div className="box">
            <h3 className="title is-5 mb-4">Groups</h3>
            <div className="columns is-multiline">
              {userGroups.map((group) => (
                <div key={group} className="column">
                  <button className="button is-info is-outlined">
                    {group}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="box mb-4">
        <h3 className="title is-5 mb-4">Your Vote</h3>
        <table className="table is-fullwidth" data-testid="vote-table">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Country</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country} data-testid={`country-row-${country}`}>
                <td>{country}</td>
                <td>
                  <div className="buttons are-small">
                    {[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].map((points) => (
                      <button
                        key={points}
                        data-testid={`vote-btn-${country}-${points}`}
                        className={`button ${
                          currentUserVotes[country] === points
                            ? 'is-primary'
                            : 'is-light'
                        }`}
                        onClick={() => {
                          const newVotes = { ...currentUserVotes }
                          if (currentUserVotes[country] === points) {
                            delete newVotes[country]
                          } else {
                            newVotes[country] = points
                          }
                          setCurrentUserVotes(newVotes)
                        }}
                      >
                        {points}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="columns is-multiline">
        <div className="column is-12" data-testid="global-results">
          <ResultTableGlobal
            countries={countries}
            globalVotes={globalVotes}
            activeVote={activeEvent}
          />
        </div>

        {userGroups.map((group) => (
          <div
            key={group}
            className="column is-6"
            data-testid={`group-section-${group}`}
          >
            <h2 className="subtitle">
              Current point totals for YOUR voting group: {group}
            </h2>
            <ResultTableLocal
              countries={countries}
              currentGroupVotes={currentGroupVotes[group] || {}}
              groupName={group}
              activeVote={activeEvent}
              data-testid={`result-table-local-${group}`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
