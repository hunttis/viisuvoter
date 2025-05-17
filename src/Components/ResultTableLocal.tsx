import React from 'react'
import { CountryScore } from './CountryScore'
import { UserVotes } from './Models'

type LocalTableProps = {
  countries: string[]
  currentGroupVotes: { [userId: string]: UserVotes }
  groupName: string
}

export const ResultTableLocal = ({
  countries,
  currentGroupVotes,
  groupName,
}: LocalTableProps) => {
  // Debug prints
  console.log('DEBUG ResultTableLocal: countries', countries)
  console.log('DEBUG ResultTableLocal: currentGroupVotes', currentGroupVotes)
  const sortedLocalCountryScores = calculateLocalGroupScores(
    countries,
    currentGroupVotes,
    groupName,
  )
  console.log(
    'DEBUG ResultTableLocal: sortedLocalCountryScores',
    sortedLocalCountryScores,
  )

  return (
    <div className="">
      <h2 className="title is-4" data-testid="group-subtitle">
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
) => {
  if (!countries || !groupVotes || !groupName) {
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
