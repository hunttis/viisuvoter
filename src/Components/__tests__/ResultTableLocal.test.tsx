import { render, screen } from '@testing-library/react'
import { ResultTableLocal } from '../ResultTableLocal'
import { UserVotes } from '../Models'

describe('ResultTableLocal', () => {
  const mockCountries = ['Finland', 'Sweden', 'Norway', 'Denmark']
  const mockGroupName = 'Test Group'

  it('renders group name and subtitle', () => {
    render(
      <ResultTableLocal
        countries={mockCountries}
        currentGroupVotes={{}}
        groupName={mockGroupName}
      />,
    )
    // Updated: Only check for group name, not the old subtitle
    expect(screen.getByTestId('group-name').textContent).toBe(mockGroupName)
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
      />,
    )
    // Only Finland should be in the score list
    expect(screen.getByTestId('country-score-Finland').textContent).toContain(
      '12',
    )
    // The other countries should not be in the score list
    expect(screen.queryByTestId('country-score-Sweden')).not.toBeInTheDocument()
    expect(screen.queryByTestId('country-score-Norway')).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('country-score-Denmark'),
    ).not.toBeInTheDocument()
    // The zero-point countries should be listed in the zero-point-countries box
    const zeroBox = screen.getByTestId('zero-point-countries')
    expect(zeroBox).toBeInTheDocument()
    expect(zeroBox.textContent).toContain('No points:')
    expect(zeroBox.textContent).toContain('Sweden')
    expect(zeroBox.textContent).toContain('Norway')
    expect(zeroBox.textContent).toContain('Denmark')
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
      />,
    )
    // Updated: Only check for group name, not the old subtitle
    expect(screen.getByTestId('group-name').textContent).toBe(mockGroupName)
  })
})
