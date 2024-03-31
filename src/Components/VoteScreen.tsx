import React from 'react'
import { UserVotes, pointAmounts } from './MainView'

type VoteScreenProps = {
  countries: string
  currentUserVotes: UserVotes[]
  vote: (point: number, country: string) => void
  activeVote: string
  activeGroupName: string
}

export const VoteScreen = ({
  countries,
  currentUserVotes,
  vote,
  activeVote,
  activeGroupName,
}: VoteScreenProps) => {
  if (!countries || !activeVote) {
    return <div>Votescreen not yet available</div>
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
