import React, { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { Profile, GlobalVotes, countryFlags, GroupVotes } from './Models'
import { ResultTableGlobal } from './ResultTableGlobal'
import { ResultTableLocal } from './ResultTableLocal'

type VoteScreenProps = {
  profile: Profile
  activeEvent: string
  activeGroupName: string
  setActiveGroupName: (name: string) => void
}

export const VoteScreen = ({ profile, activeEvent }: VoteScreenProps) => {
  const [countries, setCountries] = useState<string[]>([])
  const [currentUserVotes, setCurrentUserVotes] = useState<
    Record<string, number>
  >({})
  const [votes, setVotes] = useState<any>({})
  const [groups, setGroups] = useState<any>({})
  const [currentGroupVotes, setCurrentGroupVotes] = useState<GroupVotes>({})
  const [globalVotes, setGlobalVotes] = useState<GlobalVotes>({})

  // Load all data in parallel
  useEffect(() => {
    const db = getDatabase()
    const countriesRef = ref(db, `votingEvents/${activeEvent}/countries`)
    const votesRef = ref(db, `votes/${activeEvent}`)
    const groupsRef = ref(db, 'groups')

    const unsubCountries = onValue(countriesRef, (snapshot) => {
      if (snapshot.exists()) setCountries(snapshot.val())
      else setCountries([])
    })
    const unsubVotes = onValue(votesRef, (snapshot) => {
      // Fix: setVotes to the object with userIds as keys
      if (snapshot.exists()) {
        const val = snapshot.val()
        setVotes(val)
      } else setVotes({})
    })
    const unsubGroups = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) setGroups(snapshot.val())
      else setGroups({})
    })
    return () => {
      unsubCountries()
      unsubVotes()
      unsubGroups()
    }
  }, [activeEvent])

  // Compute group/global votes when all data is loaded
  useEffect(() => {
    // Only require groups and votes to be loaded
    if (Object.keys(groups).length > 0 && votes) {
      setCurrentUserVotes(votes[profile.uid] || {})
      const groupVotes: GroupVotes = {}
      const globalVotesData: GlobalVotes = {}
      const groupMembers: Record<string, string[]> = {}
      Object.entries(groups).forEach(([groupId, groupData]: [string, any]) => {
        if (groupData.members) {
          groupMembers[groupId] = Object.keys(groupData.members)
        }
      })
      Object.entries(groupMembers).forEach(([groupId, memberIds]) => {
        groupVotes[groupId] = {}
        globalVotesData[groupId] = {}
        memberIds.forEach((userId) => {
          // Only count if votes[userId] is a non-null object (including empty)
          if (
            votes.hasOwnProperty(userId) &&
            typeof votes[userId] === 'object'
          ) {
            groupVotes[groupId][userId] = votes[userId]
            globalVotesData[groupId][userId] = votes[userId]
          }
        })
      })
      setCurrentGroupVotes(groupVotes)
      setGlobalVotes(globalVotesData)
    }
  }, [votes, groups, profile.uid])

  // Save votes when they change
  useEffect(() => {
    const db = getDatabase()
    const votesRef = ref(db, `votes/${activeEvent}/${profile.uid}`)

    // Only save if we have votes to save
    if (Object.keys(currentUserVotes).length > 0) {
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

  // Build userGroups as array of group IDs the user is a member of
  const userGroups: string[] = profile.groups?.groupNames
    ? Object.keys(profile.groups.groupNames)
    : []

  return (
    <>
      <div
        className="is-fullwidth is-narrow vote-table"
        data-testid="vote-table"
      >
        <div>
          <div>
            <div>
              <div className="title has-text-centered">{activeEvent}</div>
            </div>
          </div>
        </div>
        <div>
          {countries.map((country) => (
            <React.Fragment key={country}>
              <div
                data-testid={`country-row-${country}`}
                className="vote-country-row"
              >
                <div className="has-text-centered has-text-weight-semibold has-text-primary is-size-6 py-1 px-2 vote-country-name">
                  {countryFlags[country] || ''} {country}{' '}
                  {countryFlags[country] || ''}
                </div>
              </div>
              <div>
                <div className="vote-buttons-row">
                  <div className="buttons vote-buttons are-small is-gapless">
                    {[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].map((points) => {
                      const isSelected = currentUserVotes[country] === points
                      const countryHasScore =
                        typeof currentUserVotes[country] === 'number'
                      const scoreUsedElsewhere = Object.entries(
                        currentUserVotes,
                      ).some(([c, p]) => c !== country && p === points)
                      let btnClass = 'button vote-btn '
                      if (isSelected) {
                        btnClass += 'is-primary '
                      } else if (countryHasScore) {
                        btnClass += 'is-dark is-outlined '
                      } else if (scoreUsedElsewhere) {
                        btnClass += 'is-dark is-outlined '
                      } else {
                        btnClass += 'is-info is-outlined'
                      }
                      return (
                        <button
                          key={points}
                          data-testid={`vote-btn-${country}-${points}`}
                          className={btnClass}
                          onClick={() => {
                            const newVotes = { ...currentUserVotes }
                            if (isSelected) {
                              // Always allow removing the vote for this country
                              delete newVotes[country]
                              // If this was the last vote, write an empty object to Firebase
                              if (Object.keys(newVotes).length === 0) {
                                const db = getDatabase()
                                const votesRef = ref(
                                  db,
                                  `votes/${activeEvent}/${profile.uid}`,
                                )
                                set(votesRef, {})
                                setCurrentUserVotes({}) // <-- Ensure local state is cleared so UI updates
                                return // Exit early to avoid calling setCurrentUserVotes again below
                              }
                            } else {
                              Object.entries(newVotes).forEach(([c, p]) => {
                                if (c !== country && p === points) {
                                  delete newVotes[c]
                                }
                              })
                              newVotes[country] = points
                            }
                            setCurrentUserVotes(newVotes)
                          }}
                        >
                          {points}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid p-3">
        <div className="cell" data-testid="global-results">
          <ResultTableGlobal countries={countries} globalVotes={globalVotes} />
        </div>

        {userGroups.map((groupId) => {
          return (
            <div
              key={groupId}
              className="is-6 cell"
              data-testid={`group-section-${profile.groups.groupNames[groupId] || groupId}`}
            >
              <ResultTableLocal
                countries={countries}
                currentGroupVotes={currentGroupVotes[groupId] || {}}
                groupName={profile.groups.groupNames[groupId] || groupId}
                data-testid={`result-table-local-${profile.groups.groupNames[groupId] || groupId}`}
              />
            </div>
          )
        })}
      </div>
    </>
  )
}
