import {createStore, combineReducers} from 'redux'
import ConfigReducer from './reducers/config.tsx';
const rootReducer = combineReducers({
  ConfigReducer,
})
const store = createStore(
  rootReducer,
  //window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
  );

export default store;