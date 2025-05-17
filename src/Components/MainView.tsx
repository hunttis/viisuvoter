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
import { Profile, UserVotes } from './Models'

export const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

interface GroupData {
  name: string
  createdBy: string
  members: Record<string, boolean>
}

const GroupsBar: React.FC<{
  userGroups: string[]
  groupNames: Record<string, string>
}> = ({ userGroups, groupNames }) => (
  <div className="buttons has-addons are-small is-centered">
    <div className="columns">
      <div className="button is-disabled">Groups</div>
      {userGroups.map((groupId) => (
        <button key={groupId} className="button is-disabled is-info">
          {groupNames[groupId] || groupId}
        </button>
      ))}
    </div>
  </div>
)

export const MainView = () => {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [activeGroupName, setActiveGroupName] = useState<string>('')
  const [showManageGroups, setShowManageGroups] = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [uid, setUid] = useState<string>('')
  const [showLogin, setShowLogin] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [activeEvent, setActiveEvent] = useState<string | null>(null)

  useEffect(() => {
    const auth = getAuth()
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid)
        const db = getDatabase()
        const profileRef = ref(db, `users/${user.uid}`)
        onValue(
          profileRef,
          (snapshot) => {
            const data = snapshot.val()
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
              setProfile(profileData)
            } else {
              const newProfile: Profile = {
                uid: user.uid,
                displayName: user.displayName || '',
                photoURL: user.photoURL || '',
                isAdmin: false,
                groups: {
                  groupNames: {},
                },
              }
              set(profileRef, newProfile)
              setProfile(newProfile)
            }
            setShowLoading(false)
          },
          () => {
            setShowLoading(false)
          },
        )

        // Load active event after user is authenticated
        await loadActiveEvent()
      } else {
        // Reset all state when user logs out
        setProfile(null)
        setUid('')
        setActiveGroupName('')
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
      }
    })
  }, [profile, activeEvent, activeGroupName])

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
    }
  }, [profile, activeEvent])

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

  const auth = getAuth()

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
    <>
      <div className="column">
        <div className="buttons has-addons are-small is-centered">
          <div className="button is-disabled">Actions</div>
          {profile?.isAdmin && (
            <button
              className="button is-primary"
              onClick={() => setShowAdmin(true)}
            >
              Admin
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
      </div>
      <div className="column">
        <GroupsBar
          userGroups={Object.keys(profile?.groups?.groupNames || {})}
          groupNames={profile?.groups?.groupNames || {}}
        />
      </div>
    </>
  )

  return (
    <div className="container" style={{ overflowX: 'hidden' }}>
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
          <div className="has-text-centered mb-5">
            <h1 className="title is-1">Eurovision Voter</h1>
          </div>
          <TopRightButtons
            profile={profile}
            setShowAdmin={setShowAdmin}
            setShowManageGroups={setShowManageGroups}
            logout={logout}
          />

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
