import React, { useState, useEffect } from 'react'
import {
  getDatabase,
  ref,
  onValue,
  set,
  remove,
  get,
  update,
  push,
} from 'firebase/database'
import { Profile } from './Models'

type ManageGroupsPageProps = {
  profile: Profile
  onBack: () => void
  uid: string
  activeVote: string
}

export const ManageGroupsPage = ({
  profile,
  onBack,
  uid,
  activeVote,
}: ManageGroupsPageProps) => {
  const [groups, setGroups] = useState<
    Array<{
      id: string
      name: string
      createdBy: string
      members: Record<string, boolean>
    }>
  >([])
  const [newGroupName, setNewGroupName] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setIsLoading(true)
        const groupsRef = ref(getDatabase(), 'groups')
        const snapshot = await get(groupsRef)

        if (snapshot.exists()) {
          const groupsData = snapshot.val()
          const groupsList = Object.entries(groupsData).map(
            ([id, data]: [string, any]) => ({
              id,
              name: data.name,
              createdBy: data.createdBy,
              members: data.members || {},
            }),
          )
          setGroups(groupsList)
        } else {
          setGroups([])
        }
      } catch (error) {
        console.error('Error loading groups:', error)
        setGroups([])
      } finally {
        setIsLoading(false)
      }
    }

    loadGroups()
  }, [])

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || !profile) return

    try {
      setIsLoading(true)
      const groupsRef = ref(getDatabase(), 'groups')
      const newGroupRef = push(groupsRef)

      const newGroup = {
        name: newGroupName.trim(),
        createdBy: uid,
        members: {
          [uid]: true,
        },
      }

      await set(newGroupRef, newGroup)

      // Update user's groups
      const userGroupsRef = ref(getDatabase(), `users/${uid}/groups/groupNames`)
      const userGroupsSnapshot = await get(userGroupsRef)
      const userGroups = userGroupsSnapshot.exists()
        ? userGroupsSnapshot.val()
        : {}

      await set(userGroupsRef, {
        ...userGroups,
        [newGroupRef.key!]: newGroupName.trim(),
      })

      setNewGroupName('')
    } catch (error) {
      console.error('Error creating group:', error)
      alert('Failed to create group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    if (!profile.isAdmin) return

    try {
      setIsLoading(true)
      const groupRef = ref(getDatabase(), `groups/${groupId}`)
      await remove(groupRef)

      // Remove group from user's groups
      const userGroupsRef = ref(getDatabase(), `users/${uid}/groups/groupNames`)
      const userGroupsSnapshot = await get(userGroupsRef)
      if (userGroupsSnapshot.exists()) {
        const userGroups = userGroupsSnapshot.val()
        const { [groupId]: removed, ...remainingGroups } = userGroups
        await set(userGroupsRef, remainingGroups)
      }

      // Refresh the groups list
      const groupsRef = ref(getDatabase(), 'groups')
      const groupsSnapshot = await get(groupsRef)
      if (groupsSnapshot.exists()) {
        const groupsData = groupsSnapshot.val()
        const groupsList = Object.entries(groupsData).map(
          ([id, data]: [string, any]) => ({
            id,
            name: data.name,
            createdBy: data.createdBy,
            members: data.members || {},
          }),
        )
        setGroups(groupsList)
      } else {
        setGroups([])
      }
    } catch (error) {
      console.error('Error deleting group:', error)
      alert('Failed to delete group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinGroup = async (groupId: string) => {
    if (!profile) return

    try {
      setIsLoading(true)
      const groupRef = ref(getDatabase(), `groups/${groupId}`)
      const groupSnapshot = await get(groupRef)

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.val()
        await update(groupRef, {
          members: {
            ...groupData.members,
            [uid]: true,
          },
        })

        // Update user's groups
        const userGroupsRef = ref(
          getDatabase(),
          `users/${uid}/groups/groupNames`,
        )
        const userGroupsSnapshot = await get(userGroupsRef)
        const userGroups = userGroupsSnapshot.exists()
          ? userGroupsSnapshot.val()
          : {}

        await set(userGroupsRef, {
          ...userGroups,
          [groupId]: groupData.name,
        })

        // Update local state
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.id === groupId
              ? {
                  ...group,
                  members: {
                    ...group.members,
                    [uid]: true,
                  },
                }
              : group,
          ),
        )
      }
    } catch (error) {
      console.error('Error joining group:', error)
      alert('Failed to join group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLeaveGroup = async (groupId: string) => {
    if (!profile) return

    try {
      setIsLoading(true)
      const groupRef = ref(getDatabase(), `groups/${groupId}`)
      const groupSnapshot = await get(groupRef)

      if (groupSnapshot.exists()) {
        const groupData = groupSnapshot.val()
        const { [uid]: removed, ...remainingMembers } = groupData.members
        await update(groupRef, {
          members: remainingMembers,
        })

        // Remove group from user's groups
        const userGroupsRef = ref(
          getDatabase(),
          `users/${uid}/groups/groupNames`,
        )
        const userGroupsSnapshot = await get(userGroupsRef)
        if (userGroupsSnapshot.exists()) {
          const userGroups = userGroupsSnapshot.val()
          const { [groupId]: removed, ...remainingGroups } = userGroups
          await set(userGroupsRef, remainingGroups)
        }

        // Update local state
        setGroups((prevGroups) =>
          prevGroups.map((group) =>
            group.id === groupId
              ? { ...group, members: remainingMembers }
              : group,
          ),
        )
      }
    } catch (error) {
      console.error('Error leaving group:', error)
      alert('Failed to leave group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newGroupName.trim()) {
      handleCreateGroup()
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container">
      <div className="section">
        <div className="level">
          <div className="level-left">
            <h2 className="title is-4">Manage Groups</h2>
          </div>
          <div className="level-right">
            <button className="button is-light" onClick={onBack}>
              Back to Voting
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label">New group name</label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control">
                  <input
                    className="input"
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter new group name"
                  />
                </div>
              </div>
              <div className="field">
                <div className="control">
                  <button
                    className="button is-primary"
                    type="submit"
                    disabled={!newGroupName.trim()}
                  >
                    Create Group
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="box">
        <h2 className="title is-4">Available Groups</h2>
        <div className="columns is-multiline">
          {groups.map((group) => {
            const isMember = group.members[uid] === true
            return (
              <div key={group.id} className="column is-3">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">{group.name}</p>
                    <button
                      className={`button is-static is-small ${
                        isMember
                          ? 'is-success is-outlined'
                          : 'is-danger is-outlined'
                      }`}
                    >
                      {isMember ? 'Member' : 'Not a Member'}
                    </button>
                  </header>
                  <div className="card-content">
                    <div className="buttons are-small">
                      {isMember ? (
                        <div className="button-group">
                          <button
                            className="button is-warning"
                            onClick={() => handleLeaveGroup(group.id)}
                          >
                            Leave
                          </button>
                          {profile.isAdmin && (
                            <button
                              className="button is-danger"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="button-group">
                          <button
                            className="button is-primary"
                            onClick={() => handleJoinGroup(group.id)}
                          >
                            Join
                          </button>
                          {profile.isAdmin && (
                            <button
                              className="button is-danger"
                              onClick={() => handleDeleteGroup(group.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
