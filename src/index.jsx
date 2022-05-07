import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import { ReactReduxFirebaseProvider } from "react-redux-firebase";
import Countries from "./Components/MainView";
import createReduxStore from "./createStore";
import "firebase/compat/database";
import "bulma/css/bulma.css";
import "./mystyle.css";
import firebase from "firebase/compat/app";
import firebaseConfig from "../config.js";

firebase.initializeApp(firebaseConfig);

const rrfConfig = { userProfile: "users" };

const store = createReduxStore();

export const rrfProps = {
  firebase,
  config: rrfConfig,
  dispatch: store.dispatch,
};

const App = () => (
  <Provider store={store}>
    <ReactReduxFirebaseProvider {...rrfProps}>
      <Countries />
    </ReactReduxFirebaseProvider>
  </Provider>
);

render(<App />, document.getElementById("app"));
