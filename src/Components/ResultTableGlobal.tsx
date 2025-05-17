import _ from 'lodash'
import { CountryScore } from './CountryScore'
import { GlobalVotes } from './Models'

type GlobalTableProps = {
  countries: string[]
  globalVotes: GlobalVotes
}

type CountryVotes = {
  name: string
  votes: number
}

export const ResultTableGlobal = ({
  countries,
  globalVotes,
}: GlobalTableProps) => {
  if (!countries || !globalVotes) {
    return <div>Global scores not yet available</div>
  }

  const sortedGlobalCountryScores: CountryVotes[] = calculateGlobalScores(
    countries,
    globalVotes,
  )

  // New: Find countries with zero points, alphabetized
  const zeroPointCountries = sortedGlobalCountryScores
    .filter((c) => c.votes === 0)
    .map((c) => c.name)
    .sort((a, b) => a.localeCompare(b))

  // Only show countries with >0 points in the ranking
  const rankedCountries = sortedGlobalCountryScores.filter((c) => c.votes > 0)

  return (
    <div className="">
      <h2 className="title is-4">🌍 Global 🌏</h2>
      {rankedCountries.map((countryVotes: CountryVotes, index: number) => (
        <div key={`${index + countryVotes.name}`}>
          <CountryScore countryVotes={countryVotes} index={index} />
        </div>
      ))}
      {/* New: List zero-point countries at the bottom */}
      {zeroPointCountries.length > 0 && (
        <div className="mt-4" data-testid="zero-point-countries">
          <div className="has-text-grey is-size-7">
            <strong>No points:</strong> {zeroPointCountries.join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

const calculateGlobalScores = (
  countries: string[],
  globalVotes: GlobalVotes,
) => {
  let scoreMap: Record<string, number> = {}

  countries
    .filter((country) => country)
    .forEach((country) => {
      scoreMap[country] = 0
    })

  // Track users already counted
  const countedUsers = new Set<string>()

  if (globalVotes && Object.entries(globalVotes).length > 0) {
    Object.values(globalVotes).forEach((groupVotes) => {
      Object.entries(groupVotes).forEach(([userId, votesFromUser]) => {
        if (!countedUsers.has(userId)) {
          countedUsers.add(userId)
          Object.entries(votesFromUser).forEach(([country, voteValue]) => {
            if (scoreMap.hasOwnProperty(country)) {
              scoreMap[country] += voteValue
            }
          })
        }
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
