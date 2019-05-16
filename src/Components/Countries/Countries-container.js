import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { compose } from 'redux'
import { firebaseConnect, isLoaded, isEmpty } from 'react-redux-firebase'
import firebase from 'firebase/app';
import 'firebase/auth';

const Countries = ({ countries }) => {

  if (!isLoaded(countries)) {
    return <div>Loading..</div>;
  } else if (isEmpty(countries)) {
    return <div>There are no countries in the DB</div>
  }

  return (
    <div className="section">
      <button onClick={() => loginGoogle()}>Login</button>
      <h1 className="title has-text-centered">Countries</h1>
      <div className="columns is-multiline is-mobile">
        {Object.entries(countries).map((countryEntry, index) => {
          const countryData = countryEntry[1];
          return (<Fragment key={index}>
            <span className="column is-6 has-text-right">{countryData}</span>
            <div className="column is-6">
            <button className="button is-success is-outlined" onClick={() => vote(12, countryData)}>
              12
            </button>
            <button className="button is-success is-outlined" onClick={() => vote(10, countryData)}>
              10
            </button>
            <button className="button is-success is-outlined" onClick={() => vote(8, countryData)}>
              8
            </button>
            </div>

          </Fragment>)
        })}
      </div>
    </div>
  )
}

function vote(points, country) {
  firebase.update(`/votes/hunttis`, {[points]: country});
}

function loginGoogle() {
  firebase.login({
    provider: 'google',
    type: 'popup',
  });
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

