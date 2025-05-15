import React, { useState, useEffect } from 'react'
import { getDatabase, ref, onValue, set } from 'firebase/database'
import { Profile, GlobalVotes, countryFlags, GroupVotes } from './Models'
import { ResultTableGlobal } from './ResultTableGlobal'
import { ResultTableLocal } from './ResultTableLocal'
import '../vote-screen.css'

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
        console.log('DEBUG votes fetched:', val)
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
    if (
      Object.keys(groups).length > 0 &&
      votes &&
      Object.keys(votes).length > 0
    ) {
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
          if (votes[userId]) {
            groupVotes[groupId][userId] = votes[userId]
            globalVotesData[groupId][userId] = votes[userId]
          }
        })
      })
      setCurrentGroupVotes(groupVotes)
      setGlobalVotes(globalVotesData)
      // Debug output
      console.log('DEBUG groupVotes:', groupVotes)
      console.log('DEBUG globalVotesData:', globalVotesData)
      console.log('DEBUG votes:', votes)
      console.log('DEBUG groups:', groups)
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

  // Debug output for local scores props
  console.log('DEBUG userGroups:', userGroups)
  console.log('DEBUG currentGroupVotes:', currentGroupVotes)
  console.log('DEBUG countries:', countries)

  // Remove the outer <div className="container"> and return the content directly
  return (
    <>
      <div className="level mb-4">
        <div className="level-left">
          <h2 className="title is-4">{activeEvent}</h2>
        </div>
        <div className="level-right">
          <div className="box">
            <h3 className="title is-5 mb-4">Groups</h3>
            <div className="columns is-multiline">
              {userGroups.map((groupId) => (
                <div key={groupId} className="column">
                  <button className="button is-info is-outlined">
                    {profile.groups.groupNames[groupId] || groupId}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <h3 className="title is-5 mb-4">Your Vote</h3>
      <table
        className="table is-fullwidth is-narrow vote-table"
        data-testid="vote-table"
      >
        <tbody>
          {countries.map((country) => (
            <React.Fragment key={country}>
              <tr
                data-testid={`country-row-${country}`}
                className="vote-country-row"
              >
                <td
                  colSpan={2}
                  className="has-text-centered has-text-weight-semibold has-text-primary is-size-6 py-1 px-2 vote-country-name"
                >
                  {countryFlags[country] || ''} {country}{' '}
                  {countryFlags[country] || ''}
                </td>
              </tr>
              <tr>
                <td colSpan={2} className="py-1 px-2 vote-buttons-row">
                  <div className="buttons vote-buttons">
                    {[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].map((points) => {
                      const isSelected = currentUserVotes[country] === points
                      const countryHasScore =
                        typeof currentUserVotes[country] === 'number'
                      const scoreUsedElsewhere = Object.entries(
                        currentUserVotes,
                      ).some(([c, p]) => c !== country && p === points)
                      let btnClass = 'button vote-btn '
                      if (isSelected) {
                        btnClass += 'is-primary'
                      } else if (countryHasScore) {
                        btnClass += 'is-dark'
                      } else if (scoreUsedElsewhere) {
                        btnClass += 'is-dark'
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
                              delete newVotes[country]
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
                </td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>

      <div className="columns is-multiline">
        <div className="column is-12" data-testid="global-results">
          <ResultTableGlobal countries={countries} globalVotes={globalVotes} />
        </div>

        {userGroups.map((groupId) => {
          // Debug output for each ResultTableLocal
          console.log('DEBUG ResultTableLocal props:', {
            groupId,
            groupName: profile.groups.groupNames[groupId] || groupId,
            currentGroupVotes: currentGroupVotes[groupId] || {},
            countries,
          })
          return (
            <div
              key={groupId}
              className="column is-6"
              data-testid={`group-section-${profile.groups.groupNames[groupId] || groupId}`}
            >
              <h2 className="subtitle">
                Current point totals for YOUR voting group:{' '}
                {profile.groups.groupNames[groupId] || groupId}
              </h2>
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
