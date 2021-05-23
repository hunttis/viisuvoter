import { createStore } from "redux";
import reducer from "./createReducer";

const initialState = {};

export default () => {
  return createStore(reducer, initialState);
};
