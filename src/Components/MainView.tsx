import React, { useState, useEffect } from 'react'
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getDatabase, onValue, ref, set, get } from 'firebase/database'
import { VoteScreen } from './VoteScreen'
import { LoginPage } from './LoginPage'
import { ManageGroupsPage } from './ManageGroupsPage'
import { AdminPage } from './AdminPage'
import { GroupVotes, Profile, UserVotes, GlobalVotes } from './Models'

export const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

interface GroupData {
  name: string
  createdBy: string
  members: Record<string, boolean>
}

export const MainView = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [currentUserVotes, setCurrentUserVotes] = useState<UserVotes[]>([])
  const [activeGroupName, setActiveGroupName] = useState<string>('')
  const [showManageGroups, setShowManageGroups] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [countries, setCountries] = useState<string[]>([])
  const [currentGroupVotes, setCurrentGroupVotes] = useState<GroupVotes>({})
  const [globalVotes, setGlobalVotes] = useState({})
  const [uid, setUid] = useState<string>('')
  const [showLogin, setShowLogin] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user?.uid)
      if (user) {
        setUid(user.uid)
        const db = getDatabase()
        const profileRef = ref(db, `users/${user.uid}`)
        console.log('Setting up profile listener for:', user.uid)
        onValue(
          profileRef,
          (snapshot) => {
            const data = snapshot.val()
            console.log('Profile data received:', data)
            if (data) {
              // Ensure the profile has all required fields
              const profileData: Profile = {
                uid: user.uid,
                displayName: data.displayName || user.displayName || '',
                photoURL: data.avatarUrl || user.photoURL || '',
                isAdmin: data.isAdmin || false,
                groups: {
                  groupNames: data.groups?.groupNames || {},
                },
              }
              console.log('Processed profile data:', profileData)
              setProfile(profileData)
            } else {
              console.log('No profile data found, creating new profile')
              const newProfile: Profile = {
                uid: user.uid,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                isAdmin: false,
                groups: {
                  groupNames: {},
                },
              }
              console.log('Creating new profile:', newProfile)
              set(profileRef, newProfile)
              setProfile(newProfile)
            }
            setShowLoading(false)
          },
          (error) => {
            console.error('Error loading profile:', error)
            setShowLoading(false)
          },
        )

        // Load active event after user is authenticated
        await loadActiveEvent()
      } else {
        console.log('No user logged in')
        // Reset all state when user logs out
        setProfile(null)
        setUid('')
        setActiveGroupName('')
        setCurrentUserVotes([])
        setCurrentGroupVotes({})
        setGlobalVotes({})
        setActiveEvent(null)
        setShowLoading(false)
        setShowLogin(true) // Show login page
      }
    })
  }, [])

  // Add new effect to load user's groups
  useEffect(() => {
    if (!uid) return

    const db = getDatabase()
    const groupsRef = ref(db, 'groups')

    const unsubscribe = onValue(groupsRef, (snapshot) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val() as Record<string, GroupData>
        const userGroups = Object.entries(groupsData)
          .filter(([_, group]) => group.members?.[uid] === true)
          .map(([id, group]) => ({
            id,
            name: group.name,
          }))

        // Update profile with user's groups
        if (profile) {
          const groupNames: Record<string, string> = {}
          userGroups.forEach((group) => {
            groupNames[group.id] = group.name
          })
          setProfile({
            ...profile,
            groups: {
              groupNames,
            },
          })
        }

        // Set initial active group if user has groups and none is selected
        if (userGroups.length > 0 && !activeGroupName) {
          setActiveGroupName(userGroups[0].name)
        }

        // Only show manage groups if we've confirmed the user has no groups
        if (userGroups.length === 0) {
          setShowManageGroups(true)
        } else {
          // If user has groups, ensure we're not showing manage groups
          setShowManageGroups(false)
        }
      }
    })

    return () => unsubscribe()
  }, [uid])

  useEffect(() => {
    if (!profile || !activeEvent) return

    const db = getDatabase()
    const userGroups = Object.values(profile.groups?.groupNames || {})

    const votesRef = ref(db, `votes/${activeEvent}`)

    onValue(votesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const userVotes: UserVotes[] = []
        userGroups.forEach((groupName) => {
          if (data[groupName] && data[groupName][profile.displayName]) {
            userVotes.push(data[groupName][profile.displayName])
          }
        })
        setCurrentUserVotes(userVotes)
        setCurrentGroupVotes(data[activeGroupName] || {})
      }
    })
  }, [profile, activeEvent, activeGroupName])

  useEffect(() => {
    if (!activeEvent) return

    const db = getDatabase()
    const countriesRef = ref(db, `votingEvents/${activeEvent}`)

    onValue(countriesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const countriesList: string[] = data.countries || []
        setCountries(countriesList)
      }
    })
  }, [activeEvent])

  useEffect(() => {
    const db = getDatabase()
    const activeEventRef = ref(db, 'activeEvent')
    const unsubscribe = onValue(activeEventRef, (snapshot) => {
      if (snapshot.exists()) {
        setActiveEvent(snapshot.val())
      } else {
        setActiveEvent(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (profile && activeEvent) {
      console.log('Profile:', profile)
      console.log('Active Event:', activeEvent)
      console.log('User Groups:', profile.groups?.groupNames)
    }
  }, [profile, activeEvent])

  useEffect(() => {
    if (!profile || !activeGroupName) return

    const db = getDatabase()
    const groupVotesRef = ref(db, `votes/${activeGroupName}`)

    onValue(groupVotesRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        const groupScores: Record<string, number> = {}

        // Aggregate votes for each country
        Object.values(data).forEach((userVotes: any) => {
          Object.entries(userVotes).forEach(
            ([country, voteValue]: [string, any]) => {
              groupScores[country] =
                (groupScores[country] || 0) + parseInt(voteValue, 10)
            },
          )
        })

        setCurrentGroupVotes(groupScores)
      } else {
        setCurrentGroupVotes({})
      }
    })
  }, [profile, activeGroupName])

  const loadActiveEvent = async () => {
    try {
      const db = getDatabase()
      const activeEventRef = ref(db, 'activeEvent')

      const eventSnapshot = await get(activeEventRef)

      const activeEventName = eventSnapshot.exists()
        ? eventSnapshot.val()
        : null

      if (activeEventName) {
        setActiveEvent(activeEventName)
      } else {
        setActiveEvent(null)
      }
      setShowLoading(false)
    } catch (error) {
      console.error('Error loading active event:', error)
      setActiveEvent(null)
      setShowLoading(false)
    }
  }

  const onSubmitGroupName = async () => {
    if (!profile || !uid) return

    const db = getDatabase()
    const newGroupRef = ref(db, `groups/${groupName}`)

    // Create the new group with the user as a member
    await set(newGroupRef, {
      name: groupName,
      createdBy: uid,
      members: {
        [uid]: true,
      },
    })

    setGroupName('')
  }

  console.log('currentUserVotes: ', currentUserVotes)
  console.log('currentGroupVotes: ', currentGroupVotes)
  console.log('globalVotes: ', globalVotes)
  console.log('countries: ', countries)

  const auth = getAuth()
  const currentUser = auth.currentUser

  const showJoinGroup =
    countries && currentUser && activeEvent && !activeGroupName
  const showVoting = countries && uid && activeGroupName && activeEvent

  const isAdmin = profile?.isAdmin === true
  console.log('Profile:', profile)
  console.log('Is Admin:', isAdmin)

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      setShowLogin(false)
    } catch (error) {
      console.error('Login error:', error)
      // Don't show the error to the user, just log it
      // The auth state listener will handle the UI state
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setShowLogin(true)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const userGroups = profile?.groups?.groupNames || []
  console.log('Debug - Active Event:', activeEvent)
  console.log('Debug - User Groups:', userGroups)

  // Update the ManageGroupsPage back button handler
  const handleManageGroupsBack = () => {
    setShowManageGroups(false)
    // Check if user is a member of any groups
    const db = getDatabase()
    const groupsRef = ref(db, 'groups')
    get(groupsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const groupsData = snapshot.val() as Record<string, GroupData>
        const userGroups = Object.entries(groupsData)
          .filter(([_, group]) => group.members?.[uid] === true)
          .map(([_, group]) => group.name)

        if (userGroups.length === 0) {
          setShowManageGroups(true)
        }
      }
    })
  }

  // Buttons component for top right actions
  interface TopRightButtonsProps {
    profile: Profile | null
    setShowAdmin: React.Dispatch<React.SetStateAction<boolean>>
    setShowManageGroups: React.Dispatch<React.SetStateAction<boolean>>
    logout: () => void
  }

  const TopRightButtons: React.FC<TopRightButtonsProps> = ({
    profile,
    setShowAdmin,
    setShowManageGroups,
    logout,
  }) => (
    <div className="buttons">
      {profile?.isAdmin && (
        <button
          className="button is-primary"
          onClick={() => setShowAdmin(true)}
        >
          Admin Panel
        </button>
      )}
      <button
        className="button is-info"
        onClick={() => setShowManageGroups(true)}
      >
        Manage Groups
      </button>
      <button className="button is-light" onClick={logout}>
        Logout
      </button>
    </div>
  )

  return (
    <div className="container">
      {showLoading ? (
        <div className="has-text-centered">
          <p className="is-size-4">Loading...</p>
        </div>
      ) : showLogin ? (
        <LoginPage onLogin={login} />
      ) : showManageGroups ? (
        <ManageGroupsPage
          profile={profile!}
          onBack={handleManageGroupsBack}
          uid={uid}
        />
      ) : showAdmin ? (
        <AdminPage profile={profile!} onBack={() => setShowAdmin(false)} />
      ) : (
        <>
          <div className="level">
            <div className="level-left">
              <h1 className="title is-1">Eurovision Voter</h1>
            </div>
            <div className="level-right">
              <TopRightButtons
                profile={profile}
                setShowAdmin={setShowAdmin}
                setShowManageGroups={setShowManageGroups}
                logout={logout}
              />
            </div>
          </div>

          {activeEvent ? (
            profile?.groups?.groupNames &&
            Object.keys(profile.groups.groupNames).length > 0 ? (
              <VoteScreen
                profile={profile}
                activeEvent={activeEvent}
                activeGroupName={activeGroupName}
                setActiveGroupName={setActiveGroupName}
              />
            ) : (
              <div className="has-text-centered">
                <p className="is-size-4">
                  You need to join a voting group first
                </p>
                <button
                  className="button is-primary mt-4"
                  onClick={() => setShowManageGroups(true)}
                >
                  Join a Group
                </button>
              </div>
            )
          ) : (
            <div className="has-text-centered">
              <p className="is-size-4">No active voting event</p>
              <p className="is-size-6 has-text-grey">
                Please wait for an admin to start a voting event
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
