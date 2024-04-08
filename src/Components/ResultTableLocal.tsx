import React from 'react'
import { CountryScore } from './CountryScore'
import { GroupVotes } from './Models'

type LocalTableProps = {
  countries: string[]
  currentGroupVotes: GroupVotes
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
      <h2 className="subtitle">
        Current point totals for <strong>YOUR</strong> voting group:{' '}
        <span className="has-text-success">{groupName}</span>
      </h2>
      {sortedLocalCountryScores.map((countryVotes, index: number) => (
        <div key={`countryscore-${index}`}>
          <CountryScore countryVotes={countryVotes} index={index} />
        </div>
      ))}
    </div>
  )
}

const calculateLocalGroupScores = (
  countries: string[],
  groupVotes: GroupVotes,
  groupName: string,
  activeVote: string,
) => {
  if (!countries || !activeVote || !groupVotes || !groupName) {
    return []
  }
  const countryScores = countries
    .map((country) => {
      let voteScore = 0

      for (const voter in groupVotes) {
        const voterEntries = Object.entries(groupVotes[voter])
        voterEntries.forEach((entry) => {
          const [voteValue, forCountry] = entry
          if (forCountry === country) {
            voteScore += parseInt(voteValue)
          }
        })
      }

      return { name: country, votes: voteScore }
    })
    .filter((score) => score)

  return countryScores.sort((a, b) => {
    return a.votes > b.votes ? -1 : 1
  })
}
