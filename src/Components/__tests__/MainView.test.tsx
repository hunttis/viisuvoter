import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MainView } from '../MainView'

// Mock child components
jest.mock('../VoteScreen', () => ({
  VoteScreen: () => <div data-testid="votescreen">VoteScreen</div>,
}))
jest.mock('../LoginPage', () => ({
  LoginPage: ({ onLogin }: { onLogin: () => void }) => (
    <div data-testid="loginpage">
      LoginPage
      <button onClick={onLogin}>Login</button>
    </div>
  ),
}))
jest.mock('../ManageGroupsPage', () => ({
  ManageGroupsPage: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="managegroupspage">
      ManageGroupsPage
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))
jest.mock('../AdminPage', () => ({
  AdminPage: ({ onBack }: { onBack: () => void }) => (
    <div data-testid="adminpage">
      AdminPage
      <button onClick={onBack}>Back</button>
    </div>
  ),
}))

// Mock Firebase
globalThis.firebase = {}
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}))

// Patch ref to return objects with .toString() for path matching
const mockRef = (path: string) => ({ toString: () => path })

jest.mock('firebase/database', () => {
  const actual = jest.requireActual('firebase/database')
  return {
    ...actual,
    getDatabase: jest.fn(),
    onValue: jest.fn(),
    ref: jest.fn((_: any, path: string) => mockRef(path)),
    set: jest.fn(),
    get: jest.fn(),
  }
})

describe('MainView', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Patch onValue to always return an unsubscribe function
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((...args: any[]) => {
      // If a callback is provided, call it with a dummy snapshot
      if (typeof args[1] === 'function') {
        args[1]({ exists: () => false, val: () => null })
      }
      return jest.fn() // unsubscribe function
    })
  })

  it('renders loading state', () => {
    render(<MainView />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders login page if not logged in', async () => {
    // Simulate onAuthStateChanged callback with null user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb(null)
    })
    render(<MainView />)
    await waitFor(() =>
      expect(screen.getByTestId('loginpage')).toBeInTheDocument(),
    )
  })

  it('renders manage groups page if showManageGroups is true', async () => {
    // Simulate onAuthStateChanged callback with user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb({ uid: '123', displayName: 'Test User', photoURL: '' })
    })
    // Simulate onValue for groups (no groups)
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((_: any, cb: any) => {
      cb({ exists: () => true, val: () => ({}) })
      return jest.fn()
    })
    render(<MainView />)
    await waitFor(() =>
      expect(screen.getByTestId('managegroupspage')).toBeInTheDocument(),
    )
  })

  it('renders admin page if showAdmin is true', async () => {
    // Simulate onAuthStateChanged callback with admin user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb({ uid: '123', displayName: 'Admin', photoURL: '', isAdmin: true })
    })
    // Simulate onValue for user profile, groups, and activeEvent
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((ref: any, cb: any) => {
      if (ref && ref.toString && ref.toString().includes('users/123')) {
        cb({
          val: () => ({
            displayName: 'Admin',
            avatarUrl: '',
            isAdmin: true,
            groups: { groupNames: { group1: 'Group 1' } },
          }),
        })
      } else if (ref && ref.toString && ref.toString().includes('groups')) {
        cb({
          exists: () => true,
          val: () => ({
            group1: { name: 'Group 1', members: { '123': true } },
          }),
        })
      } else if (
        ref &&
        ref.toString &&
        ref.toString().includes('activeEvent')
      ) {
        cb({ exists: () => true, val: () => 'ESC2025' })
      } else {
        cb({ exists: () => false, val: () => null })
      }
      return jest.fn()
    })
    render(<MainView />)
    // Simulate clicking Admin button
    await waitFor(() => expect(screen.getByText('Admin')).toBeInTheDocument())
    fireEvent.click(screen.getByText('Admin'))
    await waitFor(() =>
      expect(screen.getByTestId('adminpage')).toBeInTheDocument(),
    )
  })

  it('renders VoteScreen if user is in a group and event is active', async () => {
    // Simulate onAuthStateChanged callback with user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb({ uid: '123', displayName: 'Test User', photoURL: '', isAdmin: false })
    })
    // Simulate onValue for groups (has groups) and activeEvent
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((ref: any, cb: any) => {
      if (ref && ref.toString && ref.toString().includes('groups')) {
        cb({
          exists: () => true,
          val: () => ({
            group1: { name: 'Group 1', members: { '123': true } },
          }),
        })
      } else if (
        ref &&
        ref.toString &&
        ref.toString().includes('activeEvent')
      ) {
        cb({ exists: () => true, val: () => 'ESC2025' })
      } else {
        cb({ exists: () => false, val: () => null })
      }
      return jest.fn()
    })
    render(<MainView />)
    await waitFor(() =>
      expect(screen.getByTestId('votescreen')).toBeInTheDocument(),
    )
  })

  it('shows join group message if user has no groups', async () => {
    // Simulate onAuthStateChanged callback with user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb({ uid: '123', displayName: 'Test User', photoURL: '', isAdmin: false })
    })
    // Simulate onValue for user profile, groups (no groups), and activeEvent
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((ref: any, cb: any) => {
      if (ref && ref.toString && ref.toString().includes('users/123')) {
        cb({
          val: () => ({
            displayName: 'Test User',
            avatarUrl: '',
            isAdmin: false,
            groups: { groupNames: {} },
          }),
        })
      } else if (ref && ref.toString && ref.toString().includes('groups')) {
        cb({ exists: () => true, val: () => ({}) })
      } else if (
        ref &&
        ref.toString &&
        ref.toString().includes('activeEvent')
      ) {
        cb({ exists: () => true, val: () => 'ESC2025' })
      } else {
        cb({ exists: () => false, val: () => null })
      }
      return jest.fn()
    })
    render(<MainView />)
    await waitFor(() =>
      expect(screen.getByTestId('managegroupspage')).toBeInTheDocument(),
    )
  })

  it('shows no active event message if no event is active', async () => {
    // Simulate onAuthStateChanged callback with user
    const { onAuthStateChanged } = require('firebase/auth')
    onAuthStateChanged.mockImplementation((_: any, cb: any) => {
      cb({ uid: '123', displayName: 'Test User', photoURL: '' })
    })
    // Simulate onValue for groups (has groups)
    const { onValue } = require('firebase/database')
    onValue.mockImplementation((ref: any, cb: any) => {
      if (typeof ref === 'string' && ref.includes('groups')) {
        cb({
          exists: () => true,
          val: () => ({
            group1: { name: 'Group 1', members: { '123': true } },
          }),
        })
      } else if (typeof ref === 'string' && ref.includes('activeEvent')) {
        cb({ exists: () => false, val: () => null })
      }
      return jest.fn()
    })
    render(<MainView />)
    await waitFor(() =>
      expect(screen.getByText(/no active voting event/i)).toBeInTheDocument(),
    )
  })
})
