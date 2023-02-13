import Container from 'react-bootstrap/Container';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import Welcome from "./Components/welcome.tsx";
import Home from "./Components/home.tsx";
import Update_profil from "./Components/update_profil.tsx";
import Pong from "./Components/pong.tsx";
import Chat from "./Components/chat.tsx";
import Private_Pong from './Components/private_pong.tsx'
import Spectate from './Components/spectate.tsx'
import Profile from './Components/profile.tsx';
import { Provider } from 'react-redux'
import store from './redux/store'
import Navbar from "./Containers/navbar.tsx";
import { CookiesProvider } from 'react-cookie';
import { RequireAuthentification, RequireNoAuthentification, RequireAuthentificationContainer } from './helpers/functions.tsx'
import Not_found from './Components/not_found.tsx'

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