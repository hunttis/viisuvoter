export type Profile = {
  displayName: string
  [key: string]: { groupName: string } | string
}

export type Countries = {
  [key: number]: string
}

export type Votes = {
  [key: string]: {
    [key: string]: {
      [key: string]: string
    }
  }
}

export type UserVotes = {
  [key: number]: string
}

export type GroupVotes = {
  [key: string]: {
    [key: number]: string
  }
}

export type GlobalVotes = {
  [key: string]: GroupVotes
}
