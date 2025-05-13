import React from 'react'
import { render, screen } from '@testing-library/react'
import { ResultTableLocal } from '../ResultTableLocal'
import { UserVotes } from '../Models'

describe('ResultTableLocal', () => {
  const mockCountries = ['Finland', 'Sweden', 'Norway', 'Denmark']
  const mockGroupName = 'Test Group'
  const mockActiveVote = 'eurovision'

  it('renders group name and subtitle', () => {
    render(
      <ResultTableLocal
        countries={mockCountries}
        currentGroupVotes={{}}
        groupName={mockGroupName}
        activeVote={mockActiveVote}
      />,
    )
    expect(screen.getByText(/Current point totals for/)).toBeInTheDocument()
    expect(screen.getByText(mockGroupName)).toBeInTheDocument()
  })

  it('calculates and sorts scores correctly', () => {
    const votes: { [userId: string]: UserVotes } = {
      user1: { Finland: 12, Sweden: 10, Norway: 8, Denmark: 7 },
      user2: { Sweden: 12, Denmark: 10, Finland: 8, Norway: 7 },
    }
    render(
      <ResultTableLocal
        countries={mockCountries}
        currentGroupVotes={votes}
        groupName={mockGroupName}
        activeVote={mockActiveVote}
      />,
    )
    // Use the new testids for each country score
    expect(screen.getByTestId('country-score-Sweden').textContent).toContain(
      'Sweden',
    )
    expect(screen.getByTestId('country-score-Sweden').textContent).toContain(
      '22',
    )
    expect(screen.getByTestId('country-score-Finland').textContent).toContain(
      'Finland',
    )
    expect(screen.getByTestId('country-score-Finland').textContent).toContain(
      '20',
    )
    expect(screen.getByTestId('country-score-Denmark').textContent).toContain(
      'Denmark',
    )
    expect(screen.getByTestId('country-score-Denmark').textContent).toContain(
      '17',
    )
    expect(screen.getByTestId('country-score-Norway').textContent).toContain(
      'Norway',
    )
    expect(screen.getByTestId('country-score-Norway').textContent).toContain(
      '15',
    )
  })

  it('shows zero points for countries with no votes', () => {
    const votes: { [userId: string]: UserVotes } = {
      user1: { Finland: 12 },
    }
    render(
      <ResultTableLocal
        countries={mockCountries}
        currentGroupVotes={votes}
        groupName={mockGroupName}
        activeVote={mockActiveVote}
      />,
    )
    const rows = screen.getAllByTestId('country-score')
    const text = rows.map((row) => row.textContent || '')
    expect(text.some((t) => t.includes('Finland') && t.includes('12'))).toBe(
      true,
    )
    expect(text.some((t) => t.includes('Sweden') && t.includes('0'))).toBe(true)
    expect(text.some((t) => t.includes('Norway') && t.includes('0'))).toBe(true)
    expect(text.some((t) => t.includes('Denmark') && t.includes('0'))).toBe(
      true,
    )
  })

  it('renders nothing for empty countries array', () => {
    const votes: { [userId: string]: UserVotes } = {
      user1: { Finland: 12 },
    }
    render(
      <ResultTableLocal
        countries={[]}
        currentGroupVotes={votes}
        groupName={mockGroupName}
        activeVote={mockActiveVote}
      />,
    )
    expect(screen.getByText(/Current point totals for/)).toBeInTheDocument()
    expect(screen.getByText(mockGroupName)).toBeInTheDocument()
  })
})
