import React from 'react'

export const VoteScreen = ({ countries, pointAmounts, castVotes, vote }) => {
  return (
    <>
      {Object.entries(countries[countries.activeVote]).map(
        (countryEntry, index) => {
          const countryData: string = countryEntry[1] as string
          return (
            <div className="field is-horizontal" key={`${index + countryData}`}>
              <div className="field-label is-normal">
                <label className="label has-text-white">
                  {countryEntry[0]}. {countryData}
                </label>
              </div>
              <div className="column is-8">
                {pointAmounts.map((pointAmount) => {
                  const voteForNumberExists = !!castVotes[pointAmount]
                  const votedForThis = castVotes[pointAmount] === countryData
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
        },
      )}
      )
    </>
  )
}
