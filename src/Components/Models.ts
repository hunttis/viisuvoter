export type VoteProfile = {
  groupNames: string[]
}

export type DatabaseStructure = {
  activeEvent: string
  votingEvents: {
    [eventId: string]: {
      countries: string[]
      votes: {
        [userId: string]: {
          [country: string]: number
        }
      }
    }
  }
  votes: {
    [eventId: string]: {
      [userId: string]: {
        [country: string]: number
      }
    }
  }
  groups: {
    [groupId: string]: {
      name: string
    }
  }
  users: {
    [userId: string]: Profile
  }
}

export type Profile = {
  uid: string
  displayName: string
  photoURL: string
  isAdmin: boolean
  groups: {
    groupNames: Record<string, string>
  }
  eurovision?: {
    groupNames: string[]
  }
}

export type UserGroups = {
  [groupId: string]: {
    [userId: string]: {
      name: string
    }
  }
}

export type Votes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string
    }
  }
}

export type UserVotes = {
  [country: string]: number // country -> points
}

export type GlobalVotes = {
  [groupName: string]: {
    [userId: string]: UserVotes
  }
}
