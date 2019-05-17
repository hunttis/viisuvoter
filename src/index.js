import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { createStore, combineReducers, compose } from 'redux';
import { reactReduxFirebase, firebaseReducer } from 'react-redux-firebase';
import Countries from './Components/Countries/Countries-container';
import firebase from 'firebase/app';
import 'firebase/database';
import 'bulma/css/bulma.css';
import './mystyle.css';

import firebaseConfig from '../config.js';
 
const rrfConfig = {
  userProfile: 'users',
}

firebase.initializeApp(firebaseConfig)
 
const createStoreWithFirebase = compose(
  reactReduxFirebase(firebase, rrfConfig), 
)(createStore)
 
const rootReducer = combineReducers({
  firebase: firebaseReducer,
})
 
const initialState = {}
const store = createStoreWithFirebase(rootReducer, initialState)
 
const App = () => (
  <Provider store={store}>
    <Countries/>
  </Provider>
);
 
render(<App/>, document.getElementById('app'));
