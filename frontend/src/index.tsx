import Container from 'react-bootstrap/Container';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Welcome from "./Components/welcome";
import Home from "./Components/home";
import Update_profil from "./Components/update_profil";
import Pong from "./Components/pong";
import Chat from "./Components/chat";
import Private_Pong from './Components/private_pong'
import Spectate from './Components/spectate'
import Profile from './Components/profile';
import { Provider } from 'react-redux'
import store from './redux/store'
import Navbar from "./Containers/navbar";
import { CookiesProvider } from 'react-cookie';
import { RequireAuthentification, RequireNoAuthentification, RequireAuthentificationContainer } from './helpers/functions'
import Not_found from './Components/not_found'

const queryParameters = new URLSearchParams(window.location.search);

function App() {
return (
  <div className="App">
      <BrowserRouter>
        {
          RequireAuthentificationContainer() && 
            <Navbar/>
        }
          <Routes>
            {
              RequireNoAuthentification("/", <Welcome/>, "/home")
            }
            {
              RequireAuthentification("/home", <Home/>, "/")
            }
            {
            	RequireAuthentification("/chat", <Chat/>, "/")
			      }
			      {
			      	RequireAuthentification("/game", <Pong/>, "/")
			      }
            {
			      	RequireAuthentification("/update_profil", <Update_profil/>, "/")
			      }
            {
			      	RequireAuthentification("/profile", <Profile/>, "/")
			      }
            {
			      	RequireAuthentification("/private_game", <Private_Pong/>, "/")
			      }
            {
			      	RequireAuthentification("/spectate", <Spectate/>, "/")
			      }
            <Route path="*" element={<Not_found />} />
          </Routes>
      </BrowserRouter>
  </div>
);
}

const root = ReactDOM.createRoot(
  document.getElementById("root")  as HTMLElement
)

root.render(
  <Provider store={store}>
    <CookiesProvider>
    <Container fluid>
        <App/>
      </Container>
    </CookiesProvider>
  </Provider>
);