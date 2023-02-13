//import { configureStore } from '@reduxjs/toolkit';
//import configReducer from './reducers/counterSlice';
//import configReducer from './reducers/config';
//import counterReducers from './reducers/counterSlice';
/*
export default configureStore({
  reducer: {
    config: configReducer,
    //counters: counterReducers,
  },
});
*/

import {createStore, combineReducers} from 'redux'
import ConfigReducer from './reducers/config.tsx';
/*import InfosPage from './Reducers/InfosPage'
import PosContactezNous from './Reducers/PosContactezNous'
import PresentationTimer from './Reducers/PresentationTimer'
import Langage from './Reducers/Langage'
import Ip from './Reducers/Ip'
import Port from './Reducers/Port'
*/
const rootReducer = combineReducers({
  ConfigReducer,
})
//const Store = createStore(InfosPage);
const store = createStore(
  rootReducer,
  window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

export default store;