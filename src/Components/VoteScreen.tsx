import React from 'react'
import { pointAmounts } from './MainView'
import { Profile, UserVotes } from './Models'
import { getDatabase, ref, update } from 'firebase/database'

type VoteScreenProps = {
  countries: string
  currentUserVotes: UserVotes[]
  profile: Profile
  activeVote: string
  activeGroupName: string
}

export const VoteScreen = ({
  countries,
  currentUserVotes,
  profile,
  activeVote,
  activeGroupName,
}: VoteScreenProps) => {
  if (!countries || !activeVote) {
    return <div>Votescreen not yet available</div>
  }

  const vote = (points, country) => {
    console.log('Voting for ', points, country)
    let countryAlreadyHasVote = false
    let whichPointsAlreadyHadVote: string | null = null

    if (currentUserVotes) {
      Object.entries(currentUserVotes).forEach(
        ([currentPoints, currentCountry]) => {
          if (country === currentCountry) {
            countryAlreadyHasVote = true
            whichPointsAlreadyHadVote = currentPoints
          }
        },
      )
    }

    const db = getDatabase()

    if (countryAlreadyHasVote) {
      console.log({
        [points]: country,
        [whichPointsAlreadyHadVote!]: null,
      })
      console.log('updating vote', {
        [points]: country,
        [whichPointsAlreadyHadVote!]: null,
      })
      update(
        ref(
          db,
          `votes/${activeVote}/${activeGroupName}/${profile.displayName}`,
        ),
        {
          [points]: country,
          [whichPointsAlreadyHadVote!]: null,
        },
      )
    } else {
      console.log('Adding new vote', {
        [points]: country,
      })
      update(
        ref(
          db,
          `votes/${activeVote}/${activeGroupName}/${profile.displayName}`,
        ),
        {
          [points]: country,
        },
      )
    }
  }

  return (
    <div>
      <h1 className="title has-text-centered">{`${activeVote} - ${activeGroupName}`}</h1>
      {Object.entries(countries).map((countryEntry, index) => {
        const countryData: string = countryEntry[1] as string
        const fieldBackground =
          index % 2 === 1 ? '' : 'has-background-info-dark'
        return (
          <div className={`field is-horizontal`} key={`${index + countryData}`}>
            <div className="field-label is-normal">
              <label className="label ">
                {countryEntry[0]}. {countryData}
              </label>
            </div>
            <div className="column is-8 p-0 is-justify-content-center">
              {pointAmounts.map((pointAmount, index) => {
                const voteForNumberExists = currentUserVotes
                  ? !!currentUserVotes[pointAmount]
                  : false
                const votedForThis =
                  currentUserVotes?.[pointAmount] === countryData

                const voteClass = votedForThis
                  ? 'is-success'
                  : voteForNumberExists
                    ? 'is-dark is-outlined'
                    : 'is-info is-outlined'
                return (
                  <button
                    key={`pointButton-${countryData}-${pointAmount}`}
                    className={`button is-small ${voteClass}`}
                    onClick={() => vote(pointAmount, countryData)}
                  >
                    {pointAmount}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
