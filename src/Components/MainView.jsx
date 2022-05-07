import React, { Component } from "react";
import { connect } from "react-redux";
import { compose } from "redux";
import { isLoaded, isEmpty, firebaseConnect } from "react-redux-firebase";
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import _ from "lodash";
import { ResultTableLocal } from "./ResultTableLocal";
import { ResultTableGlobal } from "./ResultTableGlobal";

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
          <ResultTableLocal
            profile={profile}
            countries={countries}
            votes={votes}
          />

          <hr className="is-hidden-desktop" />

          <ResultTableGlobal countries={countries} votes={votes} />
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
