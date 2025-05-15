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

export type GroupVotes = {
  [groupId: string]: {
    [userId: string]: UserVotes
  }
}

// Eurovision country to flag emoji map
export const countryFlags: Record<string, string> = {
  Albania: '🇦🇱',
  Armenia: '🇦🇲',
  Australia: '🇦🇺',
  Austria: '🇦🇹',
  Azerbaijan: '🇦🇿',
  Belgium: '🇧🇪',
  Croatia: '🇭🇷',
  Cyprus: '🇨🇾',
  Czechia: '🇨🇿',
  'Czech Republic': '🇨🇿',
  Denmark: '🇩🇰',
  Estonia: '🇪🇪',
  Finland: '🇫🇮',
  France: '🇫🇷',
  Georgia: '🇬🇪',
  Germany: '🇩🇪',
  Greece: '🇬🇷',
  Iceland: '🇮🇸',
  Ireland: '🇮🇪',
  Israel: '🇮🇱',
  Italy: '🇮🇹',
  Latvia: '🇱🇻',
  Lithuania: '🇱🇹',
  Luxembourg: '🇱🇺',
  Malta: '🇲🇹',
  Moldova: '🇲🇩',
  Netherlands: '🇳🇱',
  'North Macedonia': '🇲🇰',
  Norway: '🇳🇴',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Romania: '🇷🇴',
  'San Marino': '🇸🇲',
  Serbia: '🇷🇸',
  Slovenia: '🇸🇮',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Ukraine: '🇺🇦',
  'United Kingdom': '🇬🇧',
  Montenegro: '🇲🇪',
  Russia: '🇷🇺',
  Turkey: '🇹🇷',
  Hungary: '🇭🇺',
  Slovakia: '🇸🇰',
  Bosnia: '🇧🇦',
  'Bosnia and Herzegovina': '🇧🇦',
  Belarus: '🇧🇾',
  Morocco: '🇲🇦',
  Monaco: '🇲🇨',
  Andorra: '🇦🇩',
  Bulgaria: '🇧🇬',
  Yugoslavia: '🇷🇸',
  'Serbia and Montenegro': '🇷🇸',
}
