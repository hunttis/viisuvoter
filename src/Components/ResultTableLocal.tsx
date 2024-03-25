import React from 'react'
import { CountryScore } from './CountryScore'
import { Countries, Profile, Votes } from './MainView'

type LocalTableProps = {
  profile: Profile
  countries: Countries
  votes: Votes
  groupName: string
}

export const ResultTableLocal = ({
  profile,
  countries,
  votes,
  groupName,
}: LocalTableProps) => {
  const sortedLocalCountryScores = calculateLocalGroupScores(
    profile,
    countries,
    votes,
  )

  return (
    <div className="column">
      <h2 className="subtitle has-text-white">
        Current point totals for{' '}
        <strong className="has-text-white">YOUR</strong> voting group:{' '}
        <span className="has-text-success">{groupName}</span>
      </h2>
      {sortedLocalCountryScores.map((country: string, index: number) => (
        <div key={`countryscore-${index}`}>
          <CountryScore country={country} index={index} />
        </div>
      ))}
    </div>
  )
}

const calculateLocalGroupScores = (profile, countries, votes) => {
  const activeVote = countries.activeVote
  const groupName = profile[activeVote].groupName

  const countryScores = countries[activeVote]
    .map((country) => {
      let voteScore = 0

      for (const voter in votes?.[activeVote]?.[groupName]) {
        const voterEntries = Object.entries(votes[activeVote][groupName][voter])

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

  return countryScores
    .sort((country) => {
      return country.votes
    })
    .reverse()
}
