import React from "react";

export const CountryScore = ({ country, index, additionalStyles = "" }) => {
  let color = "";
  switch (index) {
    case 0:
      color = "has-text-success";
      break;
    case 1:
    case 2:
      color = "has-text-info";
      break;
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
    case 9:
      color = "has-text-white";
      break;
    default:
      color = "has-text-grey";
      break;
  }
  let size = "is-4";
  let fontSize = "is-small";
  return (
    <div key={country.name} className={`${size} ${color} ${additionalStyles}`}>
      <div className={`is-fullwidth is-outlined ${color} ${fontSize}`}>
        {index + 1}.&nbsp;{country.name}
        &nbsp;-&nbsp;{country.votes}
      </div>
    </div>
  );
};
