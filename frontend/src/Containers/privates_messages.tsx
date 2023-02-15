import { useEffect, useState } from "react"
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import Modal from 'react-bootstrap/Modal';
import {Button, ButtonGroup} from 'react-bootstrap';
import ListGroup from 'react-bootstrap/ListGroup';
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

const MAXLENGTH_MESSAGE = 1000;

export interface DiscussionDTO {
	id: number
	other_user: string
	other_user_name: string
	is_selected: boolean
	color: string
}

export interface DmDTO {
	id: number
	author: string
	author_name: string
	discussion_id: number
	content: string
}

export interface UsersInConv {
	ft_id: string
	username: string
}

export default function Groups_messages() {
	const navigate = useNavigate();
	const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))
	const {ip} = useSelector((state: any) => ({
		...state.ConfigReducer
	}))
	const [discussions, setDiscussions] = useState<DiscussionDTO[]>([])
	const [messages_list, setMessages_list] = useState<DmDTO[]>([])
	const [all_users_not_in_conv, setAll_users_not_in_conv] = useState<UsersInConv[]>([])
	const [selected_discussion_id, setSelected_discussion_id] = useState(-1)
	const [modal_create_a_discussion, setModal_create_a_discussion] = useState(false)
	const [messagecontent, setValue] = useState("")
	const [mouse_over_user, setMouse_over_user] = useState({id:-1, type:""})
	
	const sendMessage = (value: string) => {
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			discussionId:discussions[selected_discussion_id].id,
			receiverId:discussions[selected_discussion_id].other_user,
			content: value
		}
		socket?.emit("sendDirectMessage", message)
	}

	const newDirectMessage = (newMessage: DmDTO) => {
		if (newMessage.discussion_id === discussions[selected_discussion_id].id)
			setMessages_list([...messages_list, newMessage])

	}
	useEffect(() => {
		socket?.on("newDirectMessage", newDirectMessage)
		return () => {
			socket?.off("newDirectMessage", newDirectMessage)
		}
	}, [newDirectMessage])

	const create_private_channel = (user_id: string) => {
		setAll_users_not_in_conv([])
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			receiverId: user_id,
		}
		socket?.emit("createDiscussion", message)
	}
	const receiveNewDiscussion = (jsonReceivedFromBack: DiscussionDTO) => {
		jsonReceivedFromBack.is_selected=false
		jsonReceivedFromBack.color='none'
		setDiscussions([...discussions, jsonReceivedFromBack])
	}
	useEffect(() => {
		socket?.on("newDiscussion", receiveNewDiscussion)
		return () => {
			socket?.off("", receiveNewDiscussion)
		}
	}, [receiveNewDiscussion])

	const get_messages_by_discussion = (id: number) => {
		let url='http://'+ip+':3001/api/chat/direct_messages?token='+localStorage.getItem("token_transcandence")+"&discussionId="+id
		axios.get(url)
		.then(res => {
			setMessages_list(res.data)
		})
		.catch((error) => {
		})
	}

	const get_private_channel = () => {
		let url='http://'+ip+':3001/api/chat/discussions?token='+localStorage.getItem("token_transcandence")
		axios.get(url)
		.then(res => {
			if (res.data && res.data[0])
			{
				res.data.map((data: DiscussionDTO)=>{
					data.is_selected=false
					data.color='none'
				})
				res.data[0].is_selected=true
				res.data[0].color='blue'
				setDiscussions(res.data)
				setSelected_discussion_id(0)
				setMessages_list([])
				get_messages_by_discussion(res.data[0].id)
			}
		})
		.catch((error) => {
		})
	}
	useEffect(() => {
		get_private_channel()
	}, [])

	const getAll_users_not_in_conv = () => {
		let url='http://'+ip+':3001/api/chat/users_for_dms?token='+localStorage.getItem("token_transcandence")
		axios.get(url)
		.then(res => {
			if (res.data[0])
				setAll_users_not_in_conv(res.data)
		})
		.catch((error) => {
		})
	}
	const click_on_discussions = (i: number) => {
		if (selected_discussion_id > -1)
		{
			discussions[selected_discussion_id].is_selected=false
			discussions[selected_discussion_id].color='none'
		}
		setSelected_discussion_id(i)
		setMessages_list([])
		discussions[i].color='blue'
		discussions[i].is_selected=true
		get_messages_by_discussion(discussions[i].id)
	}

	const invite_to_game = (user_id: string) => {
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			receiverId: user_id,
			mode: "easy"
		}
		socket.emit("inviteToPlay", message)
		let message2 = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id,
			receiverId: user_id,
			mode: "easy"
		}
		navigate("/private_game?mode=easy")
		socket.emit("createPrivateGame", message2)
	}

	const invite_to_hard_game = (user_id: string) => {
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			receiverId: user_id,
			mode: "hard"
		}
		socket.emit("inviteToPlay", message)
		let message2 = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id,
			receiverId: user_id,
			mode: "hard"
		}
		navigate("/private_game?mode=hard")
		socket.emit("createPrivateGame", message2)
	}

		return (
			<>
			<div className="row">
			<div className="col" style={{minHeight:"500px", maxHeight:window.innerHeight-250, overflow:"auto", background:"#fff"}}>
			<br/>
			<br/>
					{
						discussions[0] && discussions.map((discussion, i) => {
							return (
								<div key={i} className="row" onClick={()=> {click_on_discussions(i)}}>
										<div className="col">
											<div className="card" style={{backgroundColor: selected_discussion_id === i ? "blue" : "white"}}>
												<div className="card-body">
													<h5 className="card-title">{discussion.other_user_name}</h5>
													<h6 className="card-subtitle mb-2 text-muted">nb_unread_msg</h6>
													<p className="card-text">last_msg</p>
												</div>
											</div>
										</div>
									</div>
								)
							})
						||
						(
							<div className="row" >
							<div className="col">
								<div className="card">
									<div className="card-body">
										<h5 className="card-title">Aucune conversation disponible...</h5>
									</div>
								</div>
							</div>
						</div>
						)
					}
			</div>
			<div className=" col-md-6">
				<div className="row">
					<div className="col">
						<button onClick={()=>{getAll_users_not_in_conv();setModal_create_a_discussion(true)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
							Creer une conversation
						</button>
					</div>
				</div>
				<br/>
  <div style={{minHeight:"500px", maxHeight:window.innerHeight-250, overflow:"auto", background:"#fff"}}>
				{
					(selected_discussion_id > -1 && discussions[selected_discussion_id] &&
						messages_list.map((message, i) => {
							return (
								<div className="row" key={i}>
									<div className="col">
										<div className="card">
											<div className="card-body">
												<h5
													onClick={()=>navigate("/profile?id="+message.author)}
													className="card-title"
													onMouseOver={()=>{setMouse_over_user({id:i, type:"username"})}}
													onMouseOut={()=>{setMouse_over_user({id:-1, type:""})}}
													style={{
														textDecoration: mouse_over_user.type === "username" && mouse_over_user.id === i ? "underline" : "none",
														cursor: "pointer",
														display:"inline",
														color: mouse_over_user.type === "username" && mouse_over_user.id === i ? "blue" : "black"
													}}
												>
														{message.author_name} {" "}
												</h5>
												<p className="card-text">{message.content}</p>
											</div>
										</div>
									</div>
								</div>
							)
						}))
				}
				</div>
				{
					selected_discussion_id >= 0 && 
				<div className="row">
					<div className="col">
						<div className="input-group mb-3">
							<input
								type="text"
								onChange={(e)=>{if(e.target.value.length<MAXLENGTH_MESSAGE){setValue(e.target.value)}}}
								className="form-control"
								placeholder="Type your message..."
								aria-label="Type your message..."
								aria-describedby="button_send_message"
								value={messagecontent}
								autoFocus
								onKeyPress={(e) => {
									if (e.key.toString() === "Enter") {
										sendMessage(messagecontent);setValue("")
									}
								}}
							/>
							<button onClick={() => {sendMessage(messagecontent);setValue("")}} className="btn btn-primary" type="button" id="button_send_message">Send</button>
						</div>
					</div>
				</div>
				}
				{/* Modal */}
				<Modal show={modal_create_a_discussion} onHide={()=>setModal_create_a_discussion(false)}>
            <Modal.Header closeButton>
            <Modal.Title>Creer une conversation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
			<ListGroup as="ol" numbered>
				{
					all_users_not_in_conv.map((user, i) => {
						return (
							<ListGroup.Item
								as="li"
								key={i}
								className="d-flex justify-content-between align-items-start"
							>
								<div className="ms-2 me-auto">
								<div className="fw-bold">{user.username}</div>
								</div>
								<Button variant="primary" onClick={()=>{create_private_channel(user.ft_id);setModal_create_a_discussion(false)}}>Creer</Button>
							</ListGroup.Item>
						)
					})
				}
				{
					all_users_not_in_conv.length === 0 &&
					<>Aucun utilisateur disponible</>
				}
				</ListGroup>
            </Modal.Body>
        </Modal>
			</div>
			<div className="col">
				{
					selected_discussion_id > -1 && (
						<>
							<br/><br/>
							<button onClick={()=>{invite_to_game(discussions[selected_discussion_id].other_user)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
								Défier {"(mode facile)"}
							</button>
							<br/><br/>
							<button onClick={()=>{invite_to_hard_game(discussions[selected_discussion_id].other_user)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
								Défier {"(mode difficile)"}
							</button>
						</>
					)
				}
			</div>
    	</div>
		</>
    );
}