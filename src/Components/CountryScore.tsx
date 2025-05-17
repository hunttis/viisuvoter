import React from 'react'

type CountryVotes = {
  name: string
  votes: number
}

type CountryScoreProps = {
  countryVotes: CountryVotes
  index: number
  additionalStyles?: string
}

export const CountryScore = ({
  countryVotes,
  index,
  additionalStyles = '',
}: CountryScoreProps) => {
  // console.log('CountryScore', country, index, additionalStyles)
  let color = ''
  switch (index) {
    case 0:
      color = 'has-text-success has-text-weight-bold'
      break
    case 1:
    case 2:
      color = 'has-text-info has-text-weight-bold'
      break
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      color = ''
      break
    default:
      color = 'has-text-grey'
      break
  }
  let size = 'is-4'
  let fontSize = 'is-small'
  return (
    <div
      className={`${size} ${color} ${additionalStyles} `}
      data-testid="country-score"
    >
      <div className={`is-fullwidth is-outlined ${color} ${fontSize}`}>
        {index + 1}.&nbsp;{countryVotes.name}
        &nbsp;-&nbsp;{countryVotes.votes}
      </div>
    </div>
  )
}
