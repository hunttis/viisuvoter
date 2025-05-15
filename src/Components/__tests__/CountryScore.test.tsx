import React from 'react'
import { render, screen } from '@testing-library/react'
import { CountryScore } from '../CountryScore'

describe('CountryScore', () => {
  it('renders country name and votes', () => {
    render(
      <CountryScore countryVotes={{ name: 'Finland', votes: 12 }} index={0} />,
    )
    expect(screen.getByText(/Finland/)).toBeInTheDocument()
    expect(screen.getByText(/12/)).toBeInTheDocument()
  })

  it('renders correct index and formatting', () => {
    render(
      <CountryScore countryVotes={{ name: 'Sweden', votes: 10 }} index={1} />,
    )
    expect(screen.getByText(/2\.\s*Sweden\s*-\s*10/)).toBeInTheDocument()
  })

  it('applies correct color class for top 3', () => {
    const { container: first } = render(
      <CountryScore countryVotes={{ name: 'A', votes: 1 }} index={0} />,
    )
    expect(first.querySelector('.has-text-success')).toBeInTheDocument()

    const { container: second } = render(
      <CountryScore countryVotes={{ name: 'B', votes: 2 }} index={1} />,
    )
    expect(second.querySelector('.has-text-info')).toBeInTheDocument()

    const { container: third } = render(
      <CountryScore countryVotes={{ name: 'C', votes: 3 }} index={2} />,
    )
    expect(third.querySelector('.has-text-info')).toBeInTheDocument()
  })

  it('applies additionalStyles prop', () => {
    const { container } = render(
      <CountryScore
        countryVotes={{ name: 'E', votes: 5 }}
        index={0}
        additionalStyles="my-custom-class"
      />,
    )
    expect(container.querySelector('.my-custom-class')).toBeInTheDocument()
  })
})
