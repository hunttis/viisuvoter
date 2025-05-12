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

export type Countries = {
  [key: string]: string // number -> country name
}

export type Votes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string
    }
  }
}

export type UserVotes = {
  [key: string]: string // points -> country
}

export type GroupVotes = {
  [key: string]: UserVotes // username -> votes
}

export type GlobalVotes = {
  [key: string]: GroupVotes // group -> votes
}
