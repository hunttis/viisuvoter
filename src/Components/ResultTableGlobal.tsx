import React from 'react'
import _ from 'lodash'
import { CountryScore } from './CountryScore'
import { GlobalVotes } from './Models'

type GlobalTableProps = {
  countries: string[]
  globalVotes: GlobalVotes
  activeVote: string
}

type CountryVotes = {
  name: string
  votes: number
}

export const ResultTableGlobal = ({
  countries,
  globalVotes,
  activeVote,
}: GlobalTableProps) => {
  if (!countries || !activeVote || !globalVotes) {
    return <div>Global scores not yet available</div>
  }

  const sortedGlobalCountryScores: CountryVotes[] = calculateGlobalScores(
    countries,
    globalVotes,
    activeVote,
  )

  return (
    <div className="column">
      <h2 className="subtitle ">
        Current point totals <strong>ACROSS ALL</strong> voting groups
      </h2>
      {sortedGlobalCountryScores.map(
        (countryVotes: CountryVotes, index: number) => (
          <div key={`${index + countryVotes.name}`}>
            <CountryScore countryVotes={countryVotes} index={index} />
          </div>
        ),
      )}
    </div>
  )
}

const calculateGlobalScores = (
  countries: string[],
  globalVotes: GlobalVotes,
  activeVote: string,
) => {
  let scoreMap: Record<string, number> = {}

  countries
    .filter((country) => country)
    .forEach((country) => {
      scoreMap[country] = 0
    })

  if (globalVotes && activeVote && Object.entries(globalVotes).length > 0) {
    Object.entries(globalVotes).forEach(([, groupVotes]) => {
      Object.entries(groupVotes).forEach(([, votesFromUser]) => {
        Object.entries(votesFromUser).forEach(([country, voteValue]) => {
          if (scoreMap.hasOwnProperty(country)) {
            scoreMap[country] += voteValue
          }
        })
      })
    })
  }

  let countryVotes: CountryVotes[] = Object.entries(scoreMap).map(
    (scoreEntry) => {
      const [name, score] = scoreEntry
      return { name, votes: score } as CountryVotes
    },
  )

  return countryVotes.sort((a, b) => {
    return a.votes > b.votes ? -1 : 1
  })
}
