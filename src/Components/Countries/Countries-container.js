import React, { Fragment, Component } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { firebaseConnect, isLoaded, isEmpty } from 'react-redux-firebase'
import firebase from 'firebase/app';
import 'firebase/auth';
import _ from 'lodash';

const currentYear = 2019;

class Countries extends Component {

  constructor(props) {
    super(props);
    this.state = {};
  } 

  onChange(groupName) {
    this.setState({groupName: groupName.toLowerCase()});
    console.log('state', this.state);
  }

  async onSubmitGroupName() {
    if (this.state.groupName) {
      await firebase.update(`/users/${this.props.auth.uid}/${currentYear}/`, {groupName: this.state.groupName});
    }
  }

  async leaveVotingGroup() {
    await firebase.update(`/users/${this.props.auth.uid}/${currentYear}/`, {groupName: null});
  }

  vote(points, country) {
    let countryAlreadyHasVote = false;
    let whichPointsAlreadyHadVote = 0;
    const votesForUser = _.get(this.props.votes, `${currentYear}.${this.state.groupName}.${this.props.profile.displayName}`, {})
    for (var vote in votesForUser) {
      if (country === votesForUser[vote]) {
        countryAlreadyHasVote = true;
        whichPointsAlreadyHadVote = vote;
      }
    }
    if (countryAlreadyHasVote) {
      firebase.update(`/votes/${currentYear}/${this.state.groupName}/${this.props.profile.displayName}`, {[points]: country, [whichPointsAlreadyHadVote]: null});
    } else {
      firebase.update(`/votes/${currentYear}/${this.state.groupName}/${this.props.profile.displayName}`, {[points]: country});
    }
  }
  
  async loginGoogle() {
    const result = await firebase.login({
      provider: 'google',
      type: 'popup',
    })
    this.setState({loginResult: JSON.stringify(result)})
  }

  async loginFacebook() {
    await firebase.login({
      provider: 'facebook',
      type: 'popup',
      scopes: ['email'],
    });
  }
  
  
  async logout() {
    await firebase.logout();
    window.location.reload();
  }

  calculateResults() {
    console.log(this.props.votes[currentYear][this.state.groupName])
    console.log('COUNTRIES', this.props.countries[currentYear]);
    const countries = this.props.countries[currentYear].map(country => {
      console.log('COUNTRY', country);
      let votes = 0;

      for (const voter in this.props.votes[currentYear][this.state.groupName]) {
        const voterData = this.props.votes[currentYear][this.state.groupName][voter]
        console.log('VOTER', voterData);
        for (let i = 0; i < voterData.length; i++) {
          if (voterData[i] === country) {
            votes += i * 10;
          }
        }
      }

      return {name: country, votes};
    })

    const compactedCountries = _.compact(countries);

    const sortedCountries = _.sortBy(compactedCountries, country => {
      return country.votes;
    }).reverse();

    return (
      <div className="columns is-multiline is-centered is-mobile">
        {sortedCountries.map((country, index) => {
          let color = index === 0 ? 'is-success' : 'is-white'
          color = index > 9 ? 'is-dark' : color;
          let size = index === 0 ? 'is-12' : 'is-one-quarter-tablet is-half-mobile';
          let fontSize = index === 0 ? 'is-size-4-mobile is-size-1-tablet' : 'is-small';
          return (
            <div className={`column ${size}`}>
              <div class={`button is-fullwidth is-outlined ${color} ${fontSize}`} key={country.name}><span className="has-text-white">{index+1}.&nbsp;{country.name}</span>&nbsp;-&nbsp;{country.votes}</div>
            </div>
          );
        })}
      </div>
    );
  }
  
  render() {
    const {countries, profile, votes, auth} = this.props;

    if (!isLoaded(countries)) {
      return (
        <div className="section has-text-centered">
          <p>Viisuvoter loading..</p>
          <button className="button is-loading is-info">Loading..</button>
        </div>
      );
    } else if (isEmpty(countries)) {
      return <div>There are no countries in the DB</div>
    }

    // console.log('PROFILE', profile);
    // console.log('AUTH', auth);

    if (isLoaded(profile) && isEmpty(profile)) {
      return (
        <div className="section">
          <h1 className="title has-text-centered has-text-white">Welcome to Viisuvoter!</h1>
          <div className="level">
            <div className="level-item">
              <button className="button is-success is-outlined" onClick={() => this.loginGoogle()}>Google Login</button>
              <span>&nbsp;&nbsp;</span>
              <button className="button is-info is-outlined" onClick={() => this.loginFacebook()}>Facebook Login</button>
            </div>
          </div>
        </div>
      );
    }

    // console.log('STATE', this.state);

    if (!_.get(profile, `${currentYear}.groupName`)) {
      return (
        <div className="section">
          <h1 className="title has-text-white">Join a voting group</h1>
          <h2 className="subtitle has-text-info">Use the same voting group with your friends</h2>
          <div className="field is-horizontal">
            <div className="field-label">
              <label className="label has-text-white">Voting group</label>
            </div>
            <div className="field-body">
              <input className="input" onChange={(event) => this.onChange(event.target.value)} />
            </div>
            <div className="field-body">
            	<button className="button is-info" onClick={() => this.onSubmitGroupName()}>Join</button>
            </div>
          </div>
        </div>
      );
    } else {
      if (!this.state.groupName) {
        this.setState({groupName: profile[currentYear].groupName});
      }
    }
  
    const pointAmounts = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1];
    const castVotes = _.get(votes, `${currentYear}.${this.state.groupName}.${profile.displayName}`, {});
    // console.log('VOTES', castVotes);
  
    return (
      <div className="section">
        {/* <button className="button is-info" onClick={() => loginGoogle()}>Login</button> */}
        <h1 className="title has-text-centered has-text-white">{currentYear} Finalist Countries</h1>
        <h2 className="subtitle has-text-centered has-text-white has-text-info">Voting with group: {this.state.groupName}</h2>
          {Object.entries(countries[currentYear]).map((countryEntry, index) => {
            const countryData = countryEntry[1];
            
            return (
              <div className="field is-horizontal" key={index}>
                <div className="field-label is-normal">
                  <label className="label has-text-white">{countryEntry[0]}. {countryData}</label>
                </div>
                <div className="column is-8">
                {pointAmounts.map((pointAmount) => {
                  const voteForNumberExists = !!castVotes[pointAmount];
                  const votedForThis = castVotes[pointAmount] === countryData;
                  const voteClass = votedForThis ? 'is-success' : (voteForNumberExists ? 'is-dark is-outlined' : 'is-info is-outlined');
                  return <button key={`pointButton-${countryData}-${pointAmount}`} className={`button is-small ${voteClass}`} onClick={() => this.vote(pointAmount, countryData)}>
                    {pointAmount}
                  </button>
                })}
                </div>
              </div>
            )
          })}
          <hr></hr>
          <h2 className="subtitle has-text-white">Current point totals</h2>
          {this.calculateResults()}

        <button className="button is-pulled-right is-warning is-outlined is-small" onClick={() => this.leaveVotingGroup()}>Leave voting group</button>
        <button className="button is-pulled-right is-danger is-outlined is-small" onClick={() => this.logout()}>Log out</button>
      </div>
    )
  }
}


export default compose(
  firebaseConnect([
    '/countries',
    '/votes'
  ]),
  connect((state) => ({
    countries: state.firebase.data.countries,
    votes: state.firebase.data.votes,
    auth: state.firebase.auth,
    profile: state.firebase.profile,
  }))
)(Countries);

