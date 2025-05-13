export type VoteProfile = {
  groupNames: string[]
}

export type Profile = {
  uid: string
  displayName: string
  photoURL: string
  isAdmin: boolean
  groups: {
    groupNames: Record<string, string>
  }
  '2024-final'?: {
    groupNames: string[]
  }
  eurovision?: {
    groupNames: string[]
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

export type GroupVotes = {
  [groupName: string]: {
    [userId: string]: UserVotes
  }
}

export type GlobalVotes = {
  [groupName: string]: {
    [userId: string]: UserVotes
  }
}
