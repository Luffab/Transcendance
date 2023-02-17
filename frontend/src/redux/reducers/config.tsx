const INITIAL_STATE = {
  token:null,
  socket:null,
  ip:"10.64.1.154",
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