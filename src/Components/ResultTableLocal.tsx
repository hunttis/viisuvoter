import React from 'react'
import { CountryScore } from './CountryScore'
import { UserVotes } from './Models'

type LocalTableProps = {
  countries: string[]
  currentGroupVotes: { [userId: string]: UserVotes }
  groupName: string
  activeVote: string
}

export const ResultTableLocal = ({
  countries,
  currentGroupVotes,
  groupName,
  activeVote,
}: LocalTableProps) => {
  const sortedLocalCountryScores = calculateLocalGroupScores(
    countries,
    currentGroupVotes,
    groupName,
    activeVote,
  )

  return (
    <div className="column">
      <h2 className="subtitle" data-testid="group-subtitle">
        Current point totals for <strong>YOUR</strong> voting group:{' '}
        <span className="has-text-success" data-testid="group-name">
          {groupName}
        </span>
      </h2>
      {sortedLocalCountryScores.map((countryVotes, index: number) => (
        <div
          key={`countryscore-${index}`}
          data-testid={`country-score-${countryVotes.name}`}
        >
          <CountryScore countryVotes={countryVotes} index={index} />
        </div>
      ))}
    </div>
  )
}

const calculateLocalGroupScores = (
  countries: string[],
  groupVotes: { [userId: string]: UserVotes },
  groupName: string,
  activeVote: string,
) => {
  if (!countries || !activeVote || !groupVotes || !groupName) {
    return []
  }

  const countryScores = countries.map((country) => {
    let voteScore = 0

    for (const voter in groupVotes) {
      const votesByUser = groupVotes[voter] || {}
      if (typeof votesByUser[country] === 'number') {
        voteScore += votesByUser[country]
      }
    }

    return { name: country, votes: voteScore }
  })

  // Sort by descending votes
  return countryScores.sort((a, b) => b.votes - a.votes)
}
