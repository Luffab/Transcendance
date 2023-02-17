import { Navigate } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios'
import { useEffect, useState } from "react"
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import logo from '../42_Logo.png'
import React from 'react'

export default function Welcome() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

const {ip} = useSelector((state: any) => ({
  ...state.ConfigReducer
}))
  const [tfa, setTfa] = useState("");
  const [recup, setRecup] = useState("")
  const [email_tfa, setEmail_tfa] = useState("{Mail non renseigné}");
  const [token_tfa, setToken_tfa] = useState("");
  const [code_tfa, setCode_tfa] = useState("");
  useEffect(() => {
    const queryParameters = new URLSearchParams(window.location.search)
    const tfa = queryParameters.get("tfa")
    const recup = queryParameters.get("recup")

    dispatch(
      {
          type:"ACTUAL_PAGE",
          actual_page: "welcome"
      })
    if (tfa)
      setTfa(tfa)
    if (recup)
      setRecup(recup)
    if (queryParameters.get("jwt"))
    {
      if (queryParameters.get("tfa") === "false")
      {
        let jwt = queryParameters.get("jwt")
        if (jwt)
          localStorage.setItem("token_transcandence", jwt)
      dispatch(
        {
            type:"TOKEN",
            token: queryParameters.get("jwt")
        })
        navigate("/home")
      }
      else
      {
        let jwt = queryParameters.get("jwt")
        let email = queryParameters.get("email")
        if (jwt)
          setToken_tfa(jwt)
        if (email)
          setEmail_tfa(email)
      }
    }

	}, [])

	function invitedLogin() {
		let input = (document.getElementById("userInput") as HTMLFormElement).value;
		let url='http://'+ip+':3001/api/invited/login?username='+input
		window.location.href=url
  	}

  function login() {
        window.location.href='http://'+ip+':3001/api/auth/login'
  }
  const send_tfa_code = () => {
    let url='http://'+ip+':3001/api/auth/verify_code'
    
    axios.post(url,{
      "token": token_tfa,
      "code": code_tfa
    }
    )
    .then(response => {
      setCode_tfa("")
        dispatch(
          {
            type:"TOKEN",
            token: response.data
          })
          localStorage.setItem("token_transcandence", response.data)
          navigate("/home")
      })
      .catch((error) =>{
		  	toast.error(error.response.data.message, {
		  		position: "bottom-right",
		  		autoClose: 3000,
		  		hideProgressBar: false,
		  		closeOnClick: true,
		  		pauseOnHover: true,
		  		draggable: true,
		  		progress: undefined,
		  		theme: "light",
		  		});
		  })
  }

  const send_recup_code = () => {
    let url2='http://'+ip+':3001/api/auth/2fa/recup'
    axios.post(url2,{
      "token": token_tfa,
      "email": recup
    }).then((data) => {
    })
    .catch((error) =>{
			toast.error(error.response.data.message, {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: "light",
				});
		})
  }

  return (
    <>
      {
        tfa && (
          <>
            <Form.Group className="mb-3">
              <Form.Label htmlFor="disabledTextInput">entrer le code reçu à l adresse mail suivante: [{email_tfa}]</Form.Label>
              <Form.Control  value={code_tfa} onChange={(e) => {setCode_tfa(e.target.value)}} id="disabledTextInput" placeholder="Code" />
            </Form.Group>
            <Button type="submit" onClick={()=>send_tfa_code()}>Submit</Button>
            <h4>Si vous n'avez pas recu le code, cliquez sous le bouton ci-dessous afin de l'envoyer sur votre mail de 42</h4>
            <Button type="submit" onClick={()=>send_recup_code()}>Je n'ai pas recu le mail</Button>
          </>
        ) || (
          <>
          <div style={{marginTop: "300px", textAlign: 'center'}}>
            <h2>Bienvenue sur...</h2>
            <h1 style={{textAlign: "center", fontWeight: "bold", fontSize: "100px"}}>PONG THE GAME</h1>
            <button className="btn btn-primary" onClick={()=>login()} style={{width: "10%"}}>
              Se connecter avec
              <img src={logo} style={{width: "20%", marginLeft: "5px"}}/>
            </button>
			      <input id="userInput" type="text" placeholder="Text"></input>
		  	    <button className="btn btn-secondary" onClick={()=>invitedLogin()}>Invité</button>
          </div>
          </>
        )
      }
      		<ToastContainer
			      position="bottom-right"
			      autoClose={3000}
			      hideProgressBar={false}
			      newestOnTop={false}
			      closeOnClick
			      rtl={false}
			      pauseOnFocusLoss
			      draggable
			      pauseOnHover
			      theme="light"
		      />
    </>
  );
}