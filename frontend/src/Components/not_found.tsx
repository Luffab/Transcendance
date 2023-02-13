import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import React from 'react'
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import {Button, ButtonGroup} from 'react-bootstrap';


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