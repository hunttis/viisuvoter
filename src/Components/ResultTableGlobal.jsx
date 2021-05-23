import React from "react";
import _ from "lodash";
import { CountryScore } from "./CountryScore";

export const ResultTableGlobal = ({ countries, votes }) => {
  const sortedGlobalCountryScores = calculateGlobalScores(countries, votes);

  return (
    <div className="column">
      <h2 className="subtitle has-text-white">
        Current point totals{" "}
        <strong className="has-text-white">ACROSS ALL</strong> voting groups
      </h2>
      {sortedGlobalCountryScores.map((country, index) => (
        <CountryScore
          country={country}
          index={index}
          key={`${index + country}`}
        />
      ))}
    </div>
  );
};

const calculateGlobalScores = (countries, votes) => {
  const activeVote = countries.activeVote;

  let scoreMap = {};

  countries[activeVote]
    .filter((country) => country)
    .forEach((country) => {
      scoreMap[country] = 0;
    });

  Object.entries(votes[activeVote]).forEach((groupEntry) => {
    const [, groupVotes] = groupEntry;
    Object.entries(groupVotes).forEach((groupVoteEntry) => {
      const [, votesFromUser] = groupVoteEntry;
      Object.entries(votesFromUser).forEach((entry) => {
        const [voteValue, forCountry] = entry;
        scoreMap[forCountry] = scoreMap[forCountry] + parseInt(voteValue);
      });
    });
  });

  let mapped = Object.entries(scoreMap).map((scoreEntry) => {
    const [name, votes] = scoreEntry;
    return { name, votes };
  });

  return _.sortBy(mapped, (country) => {
    return country.votes;
  }).reverse();
};
