import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import 'react-toastify/dist/ReactToastify.css';
import {Button} from 'react-bootstrap';


export default function Home() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
		dispatch(
			{
				type:"ACTUAL_PAGE",
				actual_page: "not_found"
			})
	}, [])
    return (
      <>
        <h1>404 Not found</h1>
        <Button onClick={()=>{navigate("/home")}} variant="primary">Revenir à l'accueil</Button>
      </>
    );
  }