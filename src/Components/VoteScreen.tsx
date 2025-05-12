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
  const [currentGroupVotes, setCurrentGroupVotes] = useState<GroupVotes>({})
  const [globalVotes, setGlobalVotes] = useState<GlobalVotes>({})

  useEffect(() => {
    const db = getDatabase()

    // Load countries for active event
    const countriesRef = ref(db, `votingEvents/${activeEvent}/countries`)
    const countriesUnsubscribe = onValue(countriesRef, (snapshot) => {
      if (snapshot.exists()) {
        setCountries(snapshot.val())
      }
    })

    // Load votes for active event
    const votesRef = ref(db, `votes/${activeEvent}`)
    const votesUnsubscribe = onValue(votesRef, (snapshot) => {
      if (snapshot.exists()) {
        const votes = snapshot.val()
        console.log('Loaded votes:', votes)

        // Set current user's votes only if we don't already have them
        if (Object.keys(currentUserVotes).length === 0) {
          const userVotes = votes[profile.uid] || {}
          console.log('User votes:', userVotes)
          setCurrentUserVotes(userVotes)
        }

        // Calculate group votes
        const groupVotes: GroupVotes = {}
        const globalVotesData: GlobalVotes = {}

        // First, get all users and their group memberships
        const usersRef = ref(db, 'users')
        onValue(usersRef, (usersSnapshot) => {
          if (usersSnapshot.exists()) {
            const users = usersSnapshot.val()

            // For each user's votes
            Object.entries(votes).forEach(
              ([userId, userVotes]: [string, any]) => {
                if (typeof userVotes === 'object') {
                  const user = users[userId]
                  if (user?.groups?.groupNames) {
                    // Add votes to each group the user belongs to
                    const groupNames = user.groups.groupNames as Record<
                      string,
                      string
                    >
                    Object.entries(groupNames).forEach(
                      ([groupId, groupName]) => {
                        if (!groupVotes[userId]) {
                          groupVotes[userId] = {}
                        }
                        groupVotes[userId] = userVotes

                        // Add to global votes under the group name
                        if (!globalVotesData[groupName]) {
                          globalVotesData[groupName] = {}
                        }
                        globalVotesData[groupName][userId] = userVotes
                      },
                    )
                  }
                }
              },
            )

            console.log('Group votes:', groupVotes)
            console.log('Global votes:', globalVotesData)
            setCurrentGroupVotes(groupVotes)
            setGlobalVotes(globalVotesData)
          }
        })
      }
    })

    return () => {
      countriesUnsubscribe()
      votesUnsubscribe()
    }
  }, [activeEvent, profile.uid, activeGroupName])

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
        <table className="table is-fullwidth">
          <thead>
            <tr>
              <th style={{ width: '40%' }}>Country</th>
              <th>Points</th>
            </tr>
          </thead>
          <tbody>
            {countries.map((country) => (
              <tr key={country}>
                <td>{country}</td>
                <td>
                  <div className="buttons are-small">
                    {[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].map((points) => (
                      <button
                        key={points}
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
        <div className="column is-12">
          <ResultTableGlobal
            countries={countries}
            globalVotes={globalVotes}
            activeVote={activeEvent}
          />
        </div>

        {userGroups.map((group) => (
          <div key={group} className="column is-6">
            <ResultTableLocal
              countries={countries}
              currentGroupVotes={currentGroupVotes}
              groupName={group}
              activeVote={activeEvent}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
