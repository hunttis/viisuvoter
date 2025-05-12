import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { VoteScreen } from '../VoteScreen'
import { onValue, set } from 'firebase/database'
import { Profile } from '../Models'

// Mock Firebase
jest.mock('firebase/database', () => ({
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
    groupNames: ['Test Group'],
  },
}

const mockCountries = ['Finland', 'Sweden', 'Norway']

const mockVotes = {
  'test-uid': {
    Finland: '12',
    Sweden: '10',
    Norway: '8',
  },
}

describe('VoteScreen', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock database listeners
    const mockUnsubscribe = jest.fn()
    ;(onValue as jest.Mock).mockImplementation((ref, callback) => {
      if (ref.path.includes('countries')) {
        callback({ val: () => mockCountries })
      } else if (ref.path.includes('votes')) {
        callback({ val: () => mockVotes })
      }
      return mockUnsubscribe
    })
  })

  it('renders the voting table with countries', () => {
    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Check if all countries are rendered
    mockCountries.forEach((country) => {
      expect(screen.getByText(country)).toBeInTheDocument()
    })

    // Check if voting buttons are rendered
    const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]
    pointAmounts.forEach((points) => {
      expect(screen.getByText(points.toString())).toBeInTheDocument()
    })
  })

  it('displays current user votes correctly', () => {
    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Check if voted scores are highlighted
    expect(screen.getByText('12')).toHaveClass('is-primary')
    expect(screen.getByText('10')).toHaveClass('is-primary')
    expect(screen.getByText('8')).toHaveClass('is-primary')
  })

  it('displays group votes correctly', async () => {
    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Wait for group votes to be loaded
    await waitFor(() => {
      expect(screen.getByText('Group Results')).toBeInTheDocument()
    })

    // Check if group votes are displayed
    expect(screen.getByText('Finland')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('displays global votes correctly', async () => {
    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Wait for global votes to be loaded
    await waitFor(() => {
      expect(screen.getByText('Global Results')).toBeInTheDocument()
    })

    // Check if global votes are displayed
    expect(screen.getByText('Finland')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
  })

  it('handles vote submission correctly', async () => {
    const mockSet = jest.fn()
    ;(set as jest.Mock).mockImplementation(mockSet)

    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Find and click a voting button
    const voteButton = screen.getByText('12')
    fireEvent.click(voteButton)

    // Check if the vote was saved to the database
    await waitFor(() => {
      expect(mockSet).toHaveBeenCalled()
    })
  })

  it('displays loading state while fetching data', () => {
    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Initially, the loading state should be shown
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('handles empty countries list', () => {
    // Mock empty countries list
    ;(onValue as jest.Mock).mockImplementation((ref, callback) => {
      if (ref.path.includes('countries')) {
        callback({ val: () => [] })
      } else if (ref.path.includes('votes')) {
        callback({ val: () => mockVotes })
      }
      return jest.fn()
    })

    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Check if appropriate message is shown
    expect(screen.getByText('No countries available')).toBeInTheDocument()
  })

  it('handles empty votes data', () => {
    // Mock empty votes data
    ;(onValue as jest.Mock).mockImplementation((ref, callback) => {
      if (ref.path.includes('countries')) {
        callback({ val: () => mockCountries })
      } else if (ref.path.includes('votes')) {
        callback({ val: () => {} })
      }
      return jest.fn()
    })

    render(
      <VoteScreen
        profile={mockProfile}
        activeEvent="eurovision"
        activeGroupName="Test Group"
        setActiveGroupName={() => {}}
      />,
    )

    // Check if empty state is handled correctly
    expect(screen.getByText('Group Results')).toBeInTheDocument()
    expect(screen.getByText('Global Results')).toBeInTheDocument()
  })
})
