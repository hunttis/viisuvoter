import React from 'react'
import _ from 'lodash'
import { CountryScore } from './CountryScore'
import { Countries, Votes } from './MainView'

type GlobalTableProps = {
  countries: Countries
  votes: Votes
  activeVote: string
}

export const ResultTableGlobal = ({
  countries,
  votes,
  activeVote,
}: GlobalTableProps) => {
  const sortedGlobalCountryScores = calculateGlobalScores(
    countries,
    votes,
    activeVote,
  )

  return (
    <div className="column">
      <h2 className="subtitle has-text-white">
        Current point totals{' '}
        <strong className="has-text-white">ACROSS ALL</strong> voting groups
      </h2>
      {sortedGlobalCountryScores.map((country: string, index: string) => (
        <div key={`${index + country}`}>
          <CountryScore country={country} index={index} />
        </div>
      ))}
    </div>
  )
}

const calculateGlobalScores = (
  countries: Countries,
  votes: Votes,
  activeVote: string,
) => {
  let scoreMap = {}

  countries[activeVote]
    .filter((country) => country)
    .forEach((country) => {
      scoreMap[country] = 0
    })

  if (votes && activeVote && Object.entries(votes).length > 0) {
    const currentVotes = votes[activeVote] || {}
    Object.entries(currentVotes).forEach((groupEntry) => {
      const [groupKey, groupVotes] = groupEntry
      Object.entries(groupVotes).forEach((groupVoteEntry) => {
        const [, votesFromUser] = groupVoteEntry
        Object.entries(votesFromUser).forEach((entry) => {
          const [voteValue, forCountry] = entry
          scoreMap[forCountry] = scoreMap[forCountry] + parseInt(voteValue)
        })
      })
    })
  }

  let mapped = Object.entries(scoreMap).map((scoreEntry) => {
    const [name, votes] = scoreEntry
    return { name, votes }
  })

  return _.sortBy(mapped, (country) => {
    return country.votes
  }).reverse()
}
