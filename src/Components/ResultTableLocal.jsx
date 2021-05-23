import React from "react";
import _ from "lodash";
import { CountryScore } from "./CountryScore";

export const ResultTableLocal = ({ profile, countries, votes }) => {
  const sortedLocalCountryScores = calculateLocalGroupScores(
    profile,
    countries,
    votes
  );

  return (
    <div className="column">
      <h2 className="subtitle has-text-white">
        Current point totals for{" "}
        <strong className="has-text-white">YOUR</strong> voting group:{" "}
        <span className="has-text-success">
          {profile[countries.activeVote].groupName}
        </span>
      </h2>
      {sortedLocalCountryScores.map((country, index) => (
        <CountryScore
          country={country}
          index={index}
          key={`${index + country}`}
        />
      ))}
    </div>
  );
};

const calculateLocalGroupScores = (profile, countries, votes) => {
  const activeVote = countries.activeVote;
  const groupName = profile[activeVote].groupName;

  const countryScores = countries[activeVote]
    .map((country) => {
      let voteScore = 0;

      for (const voter in votes[activeVote][groupName]) {
        const voterEntries = Object.entries(
          votes[activeVote][groupName][voter]
        );

        voterEntries.forEach((entry) => {
          const [voteValue, forCountry] = entry;

          if (forCountry === country) {
            voteScore += parseInt(voteValue);
          }
        });
      }

      return { name: country, votes: voteScore };
    })
    .filter((score) => score);

  return _.sortBy(countryScores, (country) => {
    return country.votes;
  }).reverse();
};
