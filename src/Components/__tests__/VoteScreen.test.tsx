import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VoteScreen } from '../VoteScreen'
import { onValue, set } from 'firebase/database'
import { Profile } from '../Models'
import { ResultTableLocal } from '../ResultTableLocal'

// Mock Firebase
jest.mock('firebase/database', () => ({
  getDatabase: jest.fn(() => ({})),
  ref: jest.fn((db, path) => ({ path })),
  onValue: jest.fn(),
  set: jest.fn(),
}))

// Mock data
const mockProfile: Profile = {
  uid: 'test-uid',
  displayName: 'Test User',
  photoURL: 'https://example.com/photo.jpg',
  isAdmin: false,
  groups: {
    groupNames: { 'Test Group': 'Test Group' },
  },
}

const mockCountries = ['Finland', 'Sweden', 'Norway']

const mockVotes = {
  'test-uid': {
    Finland: 12,
    Sweden: 10,
    Norway: 8,
  },
  'other-user': {
    Finland: 10,
    Sweden: 12,
    Norway: 8,
  },
}

const mockGroups = {
  'group-1': {
    name: 'Test Group',
    members: {
      'test-uid': true,
      'other-user': true,
    },
  },
}

const mockUsers = {
  'test-uid': { displayName: 'Test User' },
  'other-user': { displayName: 'Other User' },
}

// Remove all previous tests and write new ones for the Eurovision voting screen

describe('VoteScreen (Eurovision voting)', () => {
  const mockProfile = {
    uid: 'user1',
    displayName: 'Eurofan',
    photoURL: '',
    isAdmin: false,
    groups: { groupNames: { 'Euro Group': 'Euro Group' } },
  }
  const mockCountries = ['Finland', 'Sweden', 'Norway']
  const mockVotes = {
    user1: { Finland: 12, Sweden: 10, Norway: 8 },
    user2: { Finland: 10, Sweden: 12, Norway: 8 },
  }
  const mockGroups = {
    'group-1': {
      name: 'Euro Group',
      members: { user1: true, user2: true },
    },
  }
  const mockUsers = {
    user1: { displayName: 'Eurofan' },
    user2: { displayName: 'Otherfan' },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    const mockUnsubscribe = jest.fn()
    ;(onValue as jest.Mock).mockImplementation((ref, callback) => {
      let valFn: () => any = () => undefined
      if (ref.path.includes('countries')) valFn = () => mockCountries
      else if (ref.path.includes('votes')) valFn = () => mockVotes
      else if (ref.path.includes('groups')) valFn = () => mockGroups
      else if (ref.path.includes('users')) valFn = () => mockUsers
      callback({
        val: valFn,
        exists: () => {
          const value = valFn()
          if (value === undefined || value === null) return false
          if (Array.isArray(value)) return value.length > 0
          if (typeof value === 'object') return Object.keys(value).length > 0
          return !!value
        },
      })
      return mockUnsubscribe
    })
  })

  it('renders all Eurovision countries and voting buttons', () => {
    render(
      <VoteScreen
        profile={mockProfile as any}
        activeEvent="eurovision"
        activeGroupName="Euro Group"
        setActiveGroupName={() => {}}
      />,
    )
    mockCountries.forEach((country) => {
      expect(screen.getByTestId(`country-row-${country}`)).toBeInTheDocument()
      ;[12, 10, 8, 7, 6, 5, 4, 3, 2, 1].forEach((points) => {
        expect(
          screen.getByTestId(`vote-btn-${country}-${points}`),
        ).toBeInTheDocument()
      })
    })
  })

  it('highlights the user’s current votes', () => {
    render(
      <VoteScreen
        profile={mockProfile as any}
        activeEvent="eurovision"
        activeGroupName="Euro Group"
        setActiveGroupName={() => {}}
      />,
    )
    expect(screen.getByTestId('vote-btn-Finland-12')).toHaveClass('is-primary')
    expect(screen.getByTestId('vote-btn-Sweden-10')).toHaveClass('is-primary')
    expect(screen.getByTestId('vote-btn-Norway-8')).toHaveClass('is-primary')
  })

  it('lets the user change their vote and saves it', async () => {
    const mockSet = jest.fn()
    ;(set as jest.Mock).mockImplementation(mockSet)
    render(
      <VoteScreen
        profile={mockProfile as any}
        activeEvent="eurovision"
        activeGroupName="Euro Group"
        setActiveGroupName={() => {}}
      />,
    )
    const btn = screen.getByTestId('vote-btn-Finland-10')
    fireEvent.click(btn)
    await waitFor(() => {
      expect(mockSet).toHaveBeenCalled()
    })
  })

  it('shows group and global results sections', async () => {
    render(
      <VoteScreen
        profile={mockProfile as any}
        activeEvent="eurovision"
        activeGroupName="Euro Group"
        setActiveGroupName={() => {}}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('group-section-Euro Group')).toBeInTheDocument()
      expect(screen.getByTestId('global-results')).toBeInTheDocument()
    })
  })

  it('renders no countries if the list is empty', async () => {
    ;(onValue as jest.Mock).mockImplementation((ref, callback) => {
      let valFn: () => any = () => undefined
      if (ref.path.includes('countries')) valFn = () => []
      else if (ref.path.includes('votes')) valFn = () => mockVotes
      else if (ref.path.includes('groups')) valFn = () => mockGroups
      else if (ref.path.includes('users')) valFn = () => mockUsers
      callback({
        val: valFn,
        exists: () => false,
      })
      return jest.fn()
    })
    render(
      <VoteScreen
        profile={mockProfile as any}
        activeEvent="eurovision"
        activeGroupName="Euro Group"
        setActiveGroupName={() => {}}
      />,
    )
    expect(screen.queryByTestId('country-row-Finland')).not.toBeInTheDocument()
    expect(screen.queryByTestId('country-row-Sweden')).not.toBeInTheDocument()
    expect(screen.queryByTestId('country-row-Norway')).not.toBeInTheDocument()
  })

  it('renders ResultTableLocal with and it has scores that are not zero', () => {
    render(
      <ResultTableLocal
        countries={mockCountries}
        currentGroupVotes={mockVotes}
        groupName="Euro Group"
        activeVote="eurovision"
      />,
    )
    expect(screen.getByTestId('group-subtitle')).toBeInTheDocument()
    expect(screen.getByTestId('group-name')).toHaveTextContent('Euro Group')
    mockCountries.forEach((country) => {
      expect(screen.getByTestId(`country-score-${country}`)).toBeInTheDocument()
    })
    expect(screen.getByTestId('country-score-Finland')).toHaveTextContent(
      'Finland - 22',
    )
    expect(screen.getByTestId('country-score-Sweden')).toHaveTextContent(
      'Sweden - 22',
    )
    expect(screen.getByTestId('country-score-Norway')).toHaveTextContent(
      'Norway - 16',
    )
  })
})
