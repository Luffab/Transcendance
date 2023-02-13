import { io, Socket } from "socket.io-client";

/*import { createSlice } from '@reduxjs/toolkit'

export const counterSlice = createSlice({
  name: 'config',
  initialState: {
    value: "",
  },
  reducers: {
    modify_token: (state, action) => {
      state.value = action.payload
    },
  },
})

export const { modify_token } = counterSlice.actions

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const get_token = (state) => state.config.value

export default counterSlice.reducer
*/
//export class Redux {
//  token: string
//  socket: any
//  ip: string
//}
//
//let tmp: Redux
//tmp = {
//  token: "",
//  socket: null,
//  ip:"10.14.1.7",
//}

const INITIAL_STATE = {
  token:null,
  socket:null,
  ip:"10.14.1.7",
  actual_page:"",
}

function Config(state=INITIAL_STATE, action: any) {
  switch (action.type) {
      case 'TOKEN': {
          return {
              ...state,
              token: action.token
          }
      }
      case 'SOCKET': {
          return {
              ...state,
              socket: action.socket
          }
      }
      case 'IP': {
          return {
              ...state,
              ip: action.ip
          }
      }
      case 'ACTUAL_PAGE': {
          return {
              ...state,
              actual_page: action.actual_page
          }
      }
  }
  return state
}

export default Config;