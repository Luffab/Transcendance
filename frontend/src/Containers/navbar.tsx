import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import { useNavigate } from "react-router-dom";
import { useSelector } from 'react-redux';
import {RequireAuthentificationContainer} from '../helpers/functions'
import jwt_decode from "jwt-decode";

function NavScrollExample() {
  const navigate = useNavigate();

  const {actual_page} = useSelector((state: any) => ({
    ...state.ConfigReducer
  }))

  const redirectProfile = () => {
    let res = localStorage.getItem("token_transcandence")
    let decoded: any
    if (res)
      decoded = jwt_decode(res);
		let id = (decoded.ft_id)
    if (actual_page !== "private_pong" && actual_page !== "pong")
      navigate("/profile?id="+id)
    else
      window.location.href = "/profile?id="+id;

	}

  return (
    <Navbar bg="light" expand="lg">
      <Container fluid>
        <Navbar.Brand style={{cursor: "pointer"}} onClick={()=>{if (actual_page !== "private_pong" && actual_page !== "pong") {navigate("/home")} else {window.location.href="/home"}}}>Home</Navbar.Brand>
        <Navbar.Brand style={{cursor: "pointer"}} onClick={()=>redirectProfile()}>Profile</Navbar.Brand>
        <Navbar.Brand style={{cursor: "pointer"}} onClick={()=>{if (actual_page !== "private_pong" && actual_page !== "pong") {navigate("/chat")} else {window.location.href="/chat"}}}>Chat</Navbar.Brand>
        <Navbar.Brand style={{cursor: "pointer"}} onClick={()=>{if (actual_page !== "private_pong" && actual_page !== "pong") {navigate("/game")} else {window.location.href="/game"}}}>Jouer</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarScroll" />
        <Navbar.Collapse id="navbarScroll">
          <Nav
            className="me-auto my-2 my-lg-0"
            style={{ maxHeight: '100px' }}
            navbarScroll
          >
          </Nav>
            {" "}
            {
              RequireAuthentificationContainer() &&
                <Button variant="danger" onClick={()=>{localStorage.clear();location.href = "/";}}>Se déconnecter</Button>
            }
            {" "}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavScrollExample;