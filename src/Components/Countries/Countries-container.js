import React, { Fragment, Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { firebaseConnect, isLoaded, isEmpty } from "react-redux-firebase";
import firebase from "firebase/app";
import "firebase/auth";
import _ from "lodash";

class Countries extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  onChange(groupName) {
    this.setState({ groupName: groupName.toLowerCase() });
  }

  async onSubmitGroupName() {
    if (this.state.groupName) {
      await firebase.update(
        `/users/${this.props.auth.uid}/${this.props.countries.activeVote}/`,
        {
          groupName: this.state.groupName,
        }
      );
    }
  }

  async leaveVotingGroup() {
    await firebase.update(
      `/users/${this.props.auth.uid}/${this.props.countries.activeVote}/`,
      {
        groupName: null,
      }
    );
  }

  vote(points, country) {
    let countryAlreadyHasVote = false;
    let whichPointsAlreadyHadVote = 0;

    const activeVote = this.props.countries.activeVote;
    const groupName = this.props.profile[activeVote].groupName;

    const votesForUser = _.get(
      this.props.votes,
      `${activeVote}.${groupName}.${this.props.profile.displayName}`,
      {}
    );
    for (var vote in votesForUser) {
      if (country === votesForUser[vote]) {
        countryAlreadyHasVote = true;
        whichPointsAlreadyHadVote = vote;
      }
    }
    if (countryAlreadyHasVote) {
      firebase.update(
        `/votes/${activeVote}/${groupName}/${this.props.profile.displayName}`,
        { [points]: country, [whichPointsAlreadyHadVote]: null }
      );
    } else {
      firebase.update(
        `/votes/${activeVote}/${groupName}/${this.props.profile.displayName}`,
        { [points]: country }
      );
    }
  }

  async loginGoogle() {
    const result = await firebase.login({
      provider: "google",
      type: "popup",
    });
    this.setState({ loginResult: JSON.stringify(result) });
  }

  async loginFacebook() {
    await firebase.login({
      provider: "facebook",
      type: "popup",
      scopes: ["email"],
    });
  }

  async logout() {
    await firebase.logout();
    window.location.reload();
  }

  calculateResults() {
    const sortedLocalCountryScores = this.calculateLocalGroupScores();
    return (
      <div className="">
        {sortedLocalCountryScores.map((country, index) => {
          return this.renderCountryScore(country, index);
        })}
      </div>
    );
  }

  calculateGlobalResults() {
    const sortedGlobalCountryScores = this.calculateGlobalScores();

    return (
      <div className="">
        {sortedGlobalCountryScores.map((country, index) => {
          return this.renderCountryScore(
            country,
            index,
            "has-background-success-dark"
          );
        })}
      </div>
    );
  }

  renderCountryScore(country, index, additionalStyles = "") {
    let color = "";
    if (index === 0) {
      color = "has-text-success";
    } else if (index === 1 || index === 2) {
      color = "has-text-info";
    } else if (index > 9) {
      color = "has-text-grey";
    }
    // let size =
    //   index === 0 ? "is-10" : "is-one-quarter-tablet is-half-mobile";
    let size = "is-4";
    let fontSize = "is-small";
    return (
      <div
        key={country.name}
        className={`${size} ${color} ${additionalStyles}`}
      >
        <div className={`is-fullwidth is-outlined ${color} ${fontSize}`}>
          {index + 1}.&nbsp;{country.name}
          &nbsp;-&nbsp;{country.votes}
        </div>
      </div>
    );
  }

  calculateGlobalScores() {
    const activeVote = this.props.countries.activeVote;
    const countries = this.props.countries[activeVote].map((country) => {
      let votes = 0;
      console.log("------ THING: ", this.props.votes[activeVote]);
      Object.entries(this.props.votes[activeVote]).forEach((groupEntry) => {
        const groupName = groupEntry[0];
        const groupVotes = groupEntry[1];
        console.log("Group:", groupName, groupVotes);
        Object.entries(groupVotes).map((groupVoteEntry) => {
          const voter = groupVoteEntry[0];
          const votesFromUser = groupVoteEntry[1];
          console.log("VOTER", voter);
          console.log("---> VOTES", votesFromUser);

          Object.entries(votesFromUser).map((entry) => {
            const voteValue = entry[0];
            const forCountry = entry[1];
            if (forCountry === country && voteValue) {
              votes += parseInt(voteValue);
            }
          });
        });
      });
      // console.log("Groups: ", groups);
      return { name: country, votes };
    });
    console.log("Countries: ", countries);
    const compactedCountries = _.compact(countries);
    return _.sortBy(compactedCountries, (country) => {
      return country.votes;
    }).reverse();
  }

  calculateLocalGroupScores() {
    const activeVote = this.props.countries.activeVote;
    const groupName = this.props.profile[activeVote].groupName;

    const countries = this.props.countries[activeVote].map((country) => {
      let votes = 0;

      for (const voter in this.props.votes[activeVote][groupName]) {
        const voterEntries = Object.entries(
          this.props.votes[activeVote][groupName][voter]
        );

        voterEntries.map((entry) => {
          const voteValue = entry[0];
          const forCountry = entry[1];
          if (forCountry === country) {
            votes += parseInt(voteValue);
          }
        });
      }

      return { name: country, votes };
    });

    const compactedCountries = _.compact(countries);

    return _.sortBy(compactedCountries, (country) => {
      return country.votes;
    }).reverse();
  }

  render() {
    const { countries, profile, votes, auth } = this.props;

    if (isLoaded(profile) && isEmpty(profile)) {
      return (
        <div className="section">
          <h1 className="title has-text-centered has-text-white">
            Welcome to Viisuvoter!
          </h1>
          <div className="level">
            <div className="level-item">
              <button
                className="button is-success is-outlined"
                onClick={() => this.loginGoogle()}
              >
                Google Login
              </button>
              <span>&nbsp;&nbsp;</span>
              <button
                className="button is-info is-outlined"
                onClick={() => this.loginFacebook()}
              >
                Facebook Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (!isLoaded(countries) && !isLoaded(profile)) {
      return (
        <h1 className="title has-text-centered has-text-white">
          <br />
          <br />
          <button className="button is-success is-loading">Loading</button>
        </h1>
      );
    }

    if (!_.get(profile, `${countries.activeVote}.groupName`)) {
      return (
        <div className="section">
          <h1 className="title has-text-white">Join a voting group</h1>
          <h2 className="subtitle has-text-info">
            Use the same voting group with your friends
          </h2>
          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label has-text-white">Voting group</label>
            </div>
            <div className="field-body">
              <input
                className="input"
                onChange={(event) => this.onChange(event.target.value)}
              />
            </div>
            <div className="field-body">
              <button
                className="button is-info"
                onClick={() => this.onSubmitGroupName()}
              >
                Join
              </button>
            </div>
          </div>
        </div>
      );
    }

    const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
    const castVotes = _.get(
      votes,
      `${countries.activeVote}.${profile[countries.activeVote].groupName}.${
        profile.displayName
      }`,
      {}
    );

    return (
      <div className="section">
        {/* <button className="button is-info" onClick={() => loginGoogle()}>Login</button> */}
        <h1 className="title has-text-centered has-text-white">
          {countries.activeVote} Finalist Countries
        </h1>
        <h2 className="subtitle has-text-centered has-text-info">
          Voting with group:&nbsp;
          <span className="has-text-success">
            {profile[countries.activeVote].groupName}
          </span>
        </h2>
        {Object.entries(countries[countries.activeVote]).map(
          (countryEntry, index) => {
            const countryData = countryEntry[1];

            return (
              <div
                className="field is-horizontal"
                key={`${index + countryData}`}
              >
                <div className="field-label is-normal">
                  <label className="label has-text-white">
                    {countryEntry[0]}. {countryData}
                  </label>
                </div>
                <div className="column is-8">
                  {pointAmounts.map((pointAmount) => {
                    const voteForNumberExists = !!castVotes[pointAmount];
                    const votedForThis = castVotes[pointAmount] === countryData;
                    const voteClass = votedForThis
                      ? "is-success"
                      : voteForNumberExists
                      ? "is-dark is-outlined"
                      : "is-info is-outlined";
                    return (
                      <button
                        key={`pointButton-${countryData}-${pointAmount}`}
                        className={`button is-small ${voteClass}`}
                        onClick={() => this.vote(pointAmount, countryData)}
                      >
                        {pointAmount}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
        )}
        <hr></hr>

        <div className="columns">
          <div className="column">
            <h2 className="subtitle has-text-white">
              Current point totals for{" "}
              <strong className="has-text-white">YOUR</strong> voting group:{" "}
              <span className="has-text-success">
                {profile[countries.activeVote].groupName}
              </span>
            </h2>
            {this.calculateResults()}
          </div>
          <hr className="is-hidden-desktop" />
          <div className="column">
            <h2 className="subtitle has-text-white">
              Current point totals{" "}
              <strong className="has-text-white">ACROSS ALL</strong> voting
              groups
            </h2>
            {this.calculateGlobalResults()}
          </div>
        </div>

        <button
          className="button is-pulled-right is-warning is-outlined is-small"
          onClick={() => this.leaveVotingGroup()}
        >
          Leave voting group
        </button>
        <button
          className="button is-pulled-right is-danger is-outlined is-small"
          onClick={() => this.logout()}
        >
          Log out
        </button>
      </div>
    );
  }
}

export default compose(
  firebaseConnect(["/countries", "/votes"]),
  connect((state) => ({
    countries: state.firebase.data.countries,
    votes: state.firebase.data.votes,
    auth: state.firebase.auth,
    profile: state.firebase.profile,
  }))
)(Countries);
