import { useEffect, useState } from "react"
import {Button, ButtonGroup} from 'react-bootstrap';
import Groups_messages from '../Containers/groups_messages.tsx'
import Privates_messages from '../Containers/privates_messages.tsx'
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

import Toast from 'react-bootstrap/Toast';
export default function Chat() {
	const dispatch = useDispatch();
	const [type_message_selected, setType_message_selected] = useState("group_channel");
	const [show, setShow] = useState({status:false, msg:""});

	const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))

	const receiveError = (newMessage: string) => {
		setShow({status:true, msg:newMessage})
		toast.error(newMessage, {
			position: "bottom-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "light",
			});

	}
	useEffect(() => {
		socket?.on("receiveError", receiveError)
		return () => {
			socket?.off("receiveError", receiveError)
		}
	}, [receiveError])

	const receiveSuccess = (newMessage: string) => {
		setShow({status:true, msg:newMessage})
		toast.success(newMessage, {
			position: "bottom-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "light",
			});

	}
	useEffect(() => {
		socket?.on("success", receiveSuccess)
		return () => {
			socket?.off("success", receiveSuccess)
		}
	}, [receiveSuccess])

	const receiveNotif = (newMessage: string) => {
		setShow({status:true, msg:newMessage})
		toast(newMessage, {
			position: "bottom-right",
			autoClose: 3000,
			hideProgressBar: false,
			closeOnClick: true,
			pauseOnHover: true,
			draggable: true,
			progress: undefined,
			theme: "light",
			});

	}
	useEffect(() => {
		socket?.on("notification", receiveNotif)
		return () => {
			socket?.off("notification", receiveNotif)
		}
	}, [receiveNotif])

	useEffect(() => {
		dispatch(
			{
				type:"ACTUAL_PAGE",
				actual_page: "chat"
			})
	}, [])

		return (
			<>
				<br/>
				{
					type_message_selected &&
						<div className="row">
						<ButtonGroup aria-label="Basic example">
							<Button onClick={()=>{setType_message_selected("group_channel")}} variant={type_message_selected=="group_channel" ? "primary": "light"}>Messages de groupe</Button>
							<Button onClick={()=>{setType_message_selected("private_channel")}} variant={type_message_selected=="group_channel" ? "light": "primary"}>Message privés</Button>
						</ButtonGroup>
						</div>
				}
				<br/>
				{
					type_message_selected === "group_channel" && 
						<>
							<Groups_messages/>
						</>
					||
						<>
							<Privates_messages/>
						</>
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