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

  // Calculate and sort scores
  const sortedLocalCountryScores = calculateLocalGroupScores(
    countries,
    currentGroupVotes,
    groupName,
  )

  // Find countries with zero points, alphabetized
  const zeroPointCountries = sortedLocalCountryScores
    .filter((c) => c.votes === 0)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b))

  // Only show countries with >0 points in the ranking
  const rankedCountries = sortedLocalCountryScores.filter((c) => c.votes > 0)

  // Check if there are any votes at all in the group
  const anyVotes = Object.values(currentGroupVotes).some(
    (userVotes) => Object.keys(userVotes).length > 0,
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
      {/* If no votes at all, show info message */}
      {!anyVotes ? (
        <span
          className="tag is-medium has-background-black-ter has-text-white-ter"
          data-testid="no-votes-message"
        >
          No votes
        </span>
      ) : (
        <>
          {rankedCountries.map((countryVotes, index: number) => (
            <div
              key={`countryscore-${index}`}
              data-testid={`country-score-${countryVotes.name}`}
            >
              <CountryScore countryVotes={countryVotes} index={index} />
            </div>
          ))}
          {/* List zero-point countries at the bottom, alphabetized */}
          {zeroPointCountries.length > 0 && (
            <div className="mt-4" data-testid="zero-point-countries">
              <div className="has-text-grey is-size-7">
                No points: {zeroPointCountries.join(', ')}
              </div>
            </div>
          )}
        </>
      )}
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
