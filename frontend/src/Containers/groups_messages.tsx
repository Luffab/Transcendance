import { useEffect, useState } from "react"
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from "react-router-dom";
import axios from 'axios'
import { useCookies } from 'react-cookie';
//import io from "socket.io-client"
import {Modal_join_a_channel} from './modal_join_a_channel.tsx'
import Modal from 'react-bootstrap/Modal';
import {Button, ButtonGroup} from 'react-bootstrap';
import Form from 'react-bootstrap/Form';
import ListGroup from 'react-bootstrap/ListGroup';
import Toast from 'react-bootstrap/Toast';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import Table from 'react-bootstrap/Table';
import Container from 'react-bootstrap/Container';
import { MDBInput } from 'mdb-react-ui-kit';
import React from 'react'

const MAXLENGTH_PASSWORD = 20;
const MAXLENGTH_MESSAGE = 1000;
const MAXLENGTH_CHANNEL = 20;
const MAX_MUTE_TIME = 525000;

export interface ChannelsDTO {
	id: number
	channel_type: string
	name: string
	owner_id: string
	is_in_chan: boolean
	is_admin: boolean 
	is_owner: boolean
	is_banned: boolean
	is_selected: boolean
	color: string
}

export interface MessagesListDTO {
	id: number
	author: string
	author_name: string
	chan_id: number
	content: string
}

export interface UsersNotInChanDTO {
	ft_id: string
	username: string
	is_invited: boolean
}

export interface UsersInChanDTO {
	ft_id: string
	username: string
	is_admin: boolean
	is_owner: boolean
	is_banned: boolean
	action: number
}

export interface deleteUserInChanDTO {
	ft_id: string
	channel_id: number
}

export interface updateUserInChanDTO {
	ft_id: string
	username: string
	is_admin: boolean
	is_owner: boolean
	is_banned: boolean
	action: number
}

export interface updateChannelsDTO {
	name: string
	owner_id: string
	channel_type: string
	id: number
	is_admin: boolean,
	is_in_chan: boolean,
	is_owner: boolean,
	is_banned: boolean,
	is_selected: boolean,
	color: string
}

export default function Groups_messages() {
	const navigate = useNavigate();
	const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))
	const {ip} = useSelector((state: any) => ({
		...state.ConfigReducer
	}))

	let initialUserSelected = {
		"ft_id": "",
		"username": "",
		"is_admin": false,
		"is_owner": false,
		"is_banned": false,
		"action": 1
	}
	const [channels, setChannels] = useState<ChannelsDTO[]>([])
	const [messages_list, setMessages_list] = useState<MessagesListDTO[]>([])
	const [new_channel_name, setNew_channel_name] = useState("")
	const [new_channel_type, setNew_channel_type] = useState("public")
	const [new_channel_password, setNew_channel_password] = useState("")
	const [selected_channel_id, setSelected_channel_id] = useState(-1)
	const [modal_join_a_channel, setModal_join_a_channel] = useState(false)
	const [modal_create_a_channel, setModal_create_a_channel] = useState(false)
	const [password_join_channel, setPassword_join_channel] = useState("")
	const [users_not_in_this_chan, setGet_users_not_in_this_chan] = useState<UsersNotInChanDTO[]>([])
	const [users_in_this_chan, setGet_users_in_this_chan] = useState<UsersInChanDTO[]>([])
	const [modal_invite_an_user_in_this_channel, setModal_invite_an_user_in_this_channel] = useState(false)
    const [modal_mute_time, setModal_mute_time] = useState(false)
	const [messagecontent, setValue] = useState("")
	const [mouse_over_user, setMouse_over_user] = useState({id:-1, type:""})
	const [modal_add_password_to_channel, setModal_add_password_to_channel] = useState(false)
	const [add_password_to_channel, setAdd_password_to_channel] = useState("")
	const [mute_time, setMute_time] = useState(1)
	const [selected_user, setSelectedUser] = useState<UsersInChanDTO>(initialUserSelected)

	const handleCloseModal_create_a_channel = () => {
		setNew_channel_name("")
		setNew_channel_password("")
		setNew_channel_type("public")
		setModal_create_a_channel(false)
	};

	const handleCloseModal_add_password_to_channel = () => {
		setAdd_password_to_channel("")
		setModal_add_password_to_channel(false)
	};

	const handleCloseModal_mute_time = () => {
		setMute_time(1)
		setModal_mute_time(false)
	};

	const sendMessage = (value: string) => {
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id,
			text: value,
			author: '',
			chanId:channels[selected_channel_id].id,
			content: value
		}
		socket?.emit("messageEmitted", message)
	}


	const messageListener = (newMessage: MessagesListDTO) => {
		if (newMessage.chan_id == channels[selected_channel_id].id)
			setMessages_list([...messages_list, newMessage])

	}
	useEffect(() => {
		socket?.on("messageEmitted", messageListener)
		return () => {
			socket?.off("messageEmitted", messageListener)
		}
	}, [messageListener])
	
	const delete_user_in_chan = (req: deleteUserInChanDTO) => {
		if (selected_channel_id > -1 && req.channel_id === channels[selected_channel_id].id)
		{
			let tmp: UsersInChanDTO[]
			tmp = [];
			users_in_this_chan.map((user)=>{
				if (user.ft_id !== req.ft_id)
					tmp.push(user)
			})
			setGet_users_in_this_chan(tmp)
		}

	}
	useEffect(() => {
		socket?.on("deleteUserInChan", delete_user_in_chan)
		return () => {
			socket?.off("deleteUserInChan", delete_user_in_chan)
		}
	}, [delete_user_in_chan])

	const add_new_user_in_chan = (res: any) => {
		res.user.action=1
		if (selected_channel_id > -1 && channels[selected_channel_id].id == res.channel_id)
			setGet_users_in_this_chan([...users_in_this_chan, res.user])
	}
	useEffect(() => {
		socket?.on("newUserInChan", add_new_user_in_chan)
		return () => {
			socket?.off("newUserInChan", add_new_user_in_chan)
		}
	}, [add_new_user_in_chan])


	const update_user_in_chan = (new_user_info: updateUserInChanDTO) => {
		let tmp: UsersInChanDTO[]
		tmp = []
		users_in_this_chan.map((user)=>{
			if (new_user_info.ft_id == user.ft_id)
            {
                new_user_info.action = user.action
				tmp.push(new_user_info)
            }
			else
				tmp.push(user)
		})
		setGet_users_in_this_chan(tmp)
	}
	useEffect(() => {
		socket?.on("updateUserInChan", update_user_in_chan)
		return () => {
			socket?.off("updateUserInChan", update_user_in_chan)
		}
	}, [update_user_in_chan])


	const updateChannel = (updated_channel: updateChannelsDTO) => {
		let tmp: ChannelsDTO[]
		tmp = []
		channels.map((channel, i)=>{
			if (channel.id === updated_channel.id)
            {
                updated_channel.is_selected = channel.is_selected
                updated_channel.color = channel.color
				if (updated_channel.is_in_chan === false && channels[selected_channel_id].id === updated_channel.id)
					setGet_users_in_this_chan([])
				tmp.push(updated_channel)
            }
			else
				tmp.push(channel)
		})
		setChannels(tmp)
	}
	useEffect(() => {
		socket?.on("updateChannel", updateChannel)
		return () => {
			socket?.off("updateChannel", updateChannel)
		}
	}, [updateChannel])

	const deleteChannel = (chan_id: number) => {
		let tmp: ChannelsDTO[]
		tmp = []
		channels.map((channel, i)=>{
			if (channel.id != chan_id)
			{
                tmp.push(channel)
            }
            else if (i === selected_channel_id)
            {
                setMessages_list([])
                setSelected_channel_id(-1)
                setGet_users_in_this_chan([])
            }
            else if (selected_channel_id > i)
            {
                setSelected_channel_id(selected_channel_id-1)
            }
		})
		setChannels(tmp)
	}
	useEffect(() => {
		socket?.on("deleteChannel", deleteChannel)
		return () => {
			socket?.off("deleteChannel", deleteChannel)
		}
	}, [deleteChannel])


	const channelJoined = (data: ChannelsDTO) => {
		let tmp: ChannelsDTO[]
		tmp = [];
		channels.map((channel, i) => {
			if (data.id !== channel.id)
				tmp.push(channel)
			else
				tmp.push(data)
		})
		setChannels(tmp)
		if (data.id == channels[selected_channel_id].id)
		{
			get_messages_by_channels(tmp[selected_channel_id].id)
			get_users_by_channels(tmp[selected_channel_id].id)
		}
	}

	useEffect(() => {
		socket?.on("channelJoined", channelJoined)
		return () => {
			socket?.off("channelJoined", channelJoined)
		}
	}, [channelJoined])


	const addChannel = (data: ChannelsDTO) => {
		setChannels([...channels, data])
	}

	useEffect(() => {
		socket?.on("addChannel", addChannel)
		return () => {
			socket?.off("addChannel", addChannel)
		}
	}, [addChannel])

	const showChannelInfos = (channelInfos: ChannelsDTO) => {
		if (selected_channel_id == -1)
		{
			channelInfos.is_selected=true
			channelInfos.color='blue'
			setSelected_channel_id(0)
			setMessages_list([])
			setGet_users_in_this_chan([])
			if (channelInfos.is_in_chan)
			{
				get_messages_by_channels(channelInfos.id)
				get_users_by_channels(channelInfos.id)
			}
		}
		else
		{
			channelInfos.is_selected=false
			channelInfos.color='none'
		}

		setChannels([...channels, channelInfos ])
	}

	useEffect(() => {
		socket?.on("channelCreated", showChannelInfos)
		return () => {
			socket?.off("channelCreated", showChannelInfos)
		}
	}, [showChannelInfos])



	const sendInvitation_private_channel = (user_id: string) => {

		let tmp_users = users_not_in_this_chan
		tmp_users.map((tmp_user, i)=>{
			if (tmp_user.ft_id == user_id)
			{
				tmp_user.is_invited = true
				tmp_users[i].is_invited = true
			}
		})
		setGet_users_not_in_this_chan(tmp_users)
		let message = {
			jwt: localStorage.getItem("token_transcandence"),
			receiverId: user_id,
			chanId:channels[selected_channel_id].id,
		}
		socket?.emit("inviteToChannel", message)
	}
	const receiveChanInvitation = (req: ChannelsDTO) => {
		let find = false
		channels.map((channel)=>{
			if (channel.id === req.id)
				find = true
		})
		if (!find)
		{
			req.is_selected=false
			req.color='none'
			setChannels([...channels, req])
		}
	}
	useEffect(() => {
		socket?.on("emitChannelInvitation", receiveChanInvitation)
		return () => {
			socket?.off("", receiveChanInvitation)
		}
	}, [receiveChanInvitation])

	const get_messages_by_channels = (id: number) => {
		let url='http://'+ip+':3001/api/chat/channel_messages?token='+localStorage.getItem("token_transcandence")+"&chan_id="+id
		axios.get(url)
		.then(res => {
			setMessages_list(res.data)
		})
		.catch((error) => {
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

	const get_users_by_channels = (id: number) => {
		let url='http://'+ip+':3001/api/chat/users_in_chan?token='+localStorage.getItem("token_transcandence")+"&channel_id="+id
		axios.get(url)
		.then(res => {
			let datas = res.data
			if (datas[0])
			{
				datas.map((data: UsersInChanDTO, i: number) => {
					datas[i].action = 1
					data.action = 1
				})
			}
			setGet_users_in_this_chan(datas)
		})
		.catch((error) => {
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

	const get_group_channel = () => {
		let url='http://'+ip+':3001/api/chat/channels?token='+localStorage.getItem("token_transcandence")
		axios.get(url)
		.then(res => {
			if (res.data && res.data[0])
			{
				res.data.map((data: ChannelsDTO)=>{
					data.is_selected=false
					data.color='none'
				})
				res.data[0].is_selected=true
				res.data[0].color='blue'
				setChannels(res.data)
				setSelected_channel_id(0)
				setMessages_list([])
				setGet_users_in_this_chan([])
				if (res.data[0].is_in_chan == true)
				{
					get_messages_by_channels(res.data[0].id)
					get_users_by_channels(res.data[0].id)
				}
			}
		})
		.catch((error) => {
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

	useEffect(() => {
		get_group_channel()
	}, [])

	const get_users_not_in_chan = () => {
		
		let url='http://'+ip+':3001/api/chat/get_users_not_in_chan?token='+localStorage.getItem("token_transcandence")+'&channel_id='+channels[selected_channel_id].id
		axios.get(url)
		.then(res => {
			setGet_users_not_in_this_chan(res.data)
		})
		.catch((error) => {
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

	const create_channel = () => {
		var channelInfos = {
			socket :socket.id,
			token: localStorage.getItem("token_transcandence"),
			channel_name: new_channel_name,
			channel_type: new_channel_type,
			password: new_channel_password
		}
		socket?.emit("createChannel", channelInfos)
		}

		const join_a_channel = () => {
			let message = {
				"token": localStorage.getItem("token_transcandence"),
				"chan_id" : channels[selected_channel_id].id,
				"password": password_join_channel
			}
			socket?.emit("joinChannel", message)
		}

		const decline_channel_invitation = () => {
			let message = {
				"token": localStorage.getItem("token_transcandence"),
				"chan_id" : channels[selected_channel_id].id
			}
			socket?.emit("declineChannelInvitation", message)
			let tab: ChannelsDTO[]
			tab = [];
			channels.map((channel, i)=>{
				if (i != selected_channel_id)
					tab.push(channel)
			})
			setMessages_list([])
			setSelected_channel_id(-1)
			setGet_users_in_this_chan([])
			setChannels(tab)
		}
		
		const click_on_channels = (i: number) => {
			if (selected_channel_id > -1)
			{
				channels[selected_channel_id].is_selected=false
				channels[selected_channel_id].color='none'
			}
			setSelected_channel_id(i)
			setMessages_list([])
			setGet_users_in_this_chan([])
			channels[i].color='blue'
			channels[i].is_selected=true
			if (channels[i].is_in_chan)
			{
				get_messages_by_channels(channels[i].id)
				get_users_by_channels(channels[i].id)
			}
			else
				setModal_join_a_channel(true)
				//join_a_channel(channels[i].id)
		}
		const click_on_action = (number: number, ft_id: string) => {
			let tmp_users = users_in_this_chan
			tmp_users.map((user, i)=>{
				if (user.ft_id == ft_id)
				{
					user.action=number
				}
			})
			setGet_users_in_this_chan(tmp_users)
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

		const ban_user = (user_id: string) => {
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
				receiverId: user_id,
			}
			socket?.emit("banUser", message)
		}
		const unban_user = (user_id: string) => {
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
				receiverId: user_id,
			}
			socket?.emit("unbanUser", message)
		}
		const mute_user = (user_id: string) => {
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
				receiverId: user_id,
				time: mute_time
			}
			socket?.emit("muteUser", message)
		}
		const giveAdminRole = (user_id: string) => {
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
				receiverId: user_id,
			}
			socket?.emit("giveAdminRole", message)
		}
        const leave_channel = () => {
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
			}
			socket?.emit("leaveChannel", message)
        }
		const _add_password_to_channel = () => {
			add_password_to_channel
			let message = {
				jwt: localStorage.getItem("token_transcandence"),
				chanId:channels[selected_channel_id].id,
				password:add_password_to_channel
			}
			socket?.emit("changePassword", message)
		}
		return (
			<>
			<Modal_join_a_channel is_active={modal_join_a_channel}/>
			<div className="row">
			<div className="col" style={{minHeight:"500px", maxHeight:window.innerHeight-250, overflow:"auto", background:"#fff"}}>
			<br/>
			<br/>
					{
						channels[0] && channels.map((channel, i) => {
							return (
								<div key={i} className="row" onClick={()=> {click_on_channels(i)}}>
										<div className="col">
											{/*<div className="card" style={{backgroundColor: channel.color}}>*/}
											<div className="card" style={{backgroundColor: selected_channel_id == i ? "blue" : "white"}}>
												<div className="card-body">
													<h5 className="card-title">{channel.name}</h5>
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
										<h5 className="card-title">Aucun channel disponible...</h5>
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
						<button onClick={()=>{setModal_create_a_channel(true)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
							Creer un channel
						</button>
					</div>
					{
						selected_channel_id > -1 && (channels[selected_channel_id].channel_type == "public" || channels[selected_channel_id].channel_type == "password") && channels[selected_channel_id].is_owner && (
							<div className="col">
								<button onClick={()=>{setModal_add_password_to_channel(true)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
									Actualiser le password
								</button>
							</div>
						)
					}
					{
						selected_channel_id > -1 && channels[selected_channel_id].channel_type == "private" && channels[selected_channel_id].is_admin && (
							<div className="col">
								<button onClick={()=>{get_users_not_in_chan();setModal_invite_an_user_in_this_channel(true)}} type="button" className="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
									Inviter un utilisateur dans ce channel
								</button>
							</div>
						)
					}
					{
						selected_channel_id > -1 && channels[selected_channel_id].is_in_chan && (
							<div className="col">
								<button onClick={()=>{leave_channel()}} type="button" className="btn btn-danger" data-bs-toggle="modal" data-bs-target="#modal_create_channel">
									Quitter le channel
								</button>
							</div>
						)
					}
				</div>
				<br/>
  <div style={{minHeight:"500px", maxHeight:window.innerHeight-250, overflow:"auto", background:"#fff"}}>
				{
					(selected_channel_id == -1 &&
						<></>)
						||
					(selected_channel_id > -1 && channels[selected_channel_id] && channels[selected_channel_id].is_in_chan &&
						messages_list[0] && messages_list.map((message, i) => {
							return (
								<div className="row">
									<div className="col">
										<div className="card">
											<div className="card-body">
												<h5
													onClick={()=>navigate("/profile?id="+message.author)}
													className="card-title"
													onMouseOver={()=>{setMouse_over_user({id:i, type:"username"})}}
													onMouseOut={()=>{setMouse_over_user({id:-1, type:""})}}
													style={{
														textDecoration: mouse_over_user.type == "username" && mouse_over_user.id == i ? "underline" : "none",
														cursor: "pointer",
														display:"inline",
														color: mouse_over_user.type == "username" && mouse_over_user.id == i ? "blue" : "black"
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
					||
					(channels[selected_channel_id].channel_type == "public" && !channels[selected_channel_id].is_in_chan &&
						<>
							<button onClick={()=>{join_a_channel()}} type="button" className="btn btn-primary">
								Rejoindre le channel
							</button>
						</>)
					||
					(channels[selected_channel_id].channel_type == "password" && !channels[selected_channel_id].is_in_chan &&
						<>
							<Form.Label htmlFor="inputPassword_join_channel">Password</Form.Label>
							<Form.Control
							type="password"
							id="inputPassword_join_channel"
							aria-describedby="passwordHelpBlock"
							onChange={(e)=>{if(e.target.value.length<MAXLENGTH_PASSWORD){setPassword_join_channel(e.target.value)}}}
							onKeyPress={(e) => {
								if (e.key.toString() === "Enter") {
									join_a_channel();setPassword_join_channel('')
								}
							}}
							value={password_join_channel}
							/>
							<button onClick={()=>{join_a_channel();setPassword_join_channel('')}} type="button" className="btn btn-primary">
								Rejoindre le channel
							</button>
						</>)
					||
					(
						channels[selected_channel_id].channel_type == "private" && !channels[selected_channel_id].is_in_chan && (
							<div className="col">
								<div className="row">
									<button onClick={()=>{decline_channel_invitation()}} type="button" className="btn btn-primary">
										Decliner l'invitation
									</button>
								</div>
								<div className="row">
									<button onClick={()=>{join_a_channel()}} type="button" className="btn btn-primary">
										Accepter l'invitation
									</button>
								</div>
							</div>
						)
					)
				}
				</div>
				{
					selected_channel_id > -1 && channels[selected_channel_id] && channels[selected_channel_id].is_in_chan &&
				<div className="row">
					<div className="col">
						<div className="input-group mb-3">
							<input
								type="text"
								onChange={(e)=>{if(e.target.value.length < MAXLENGTH_MESSAGE){setValue(e.target.value)}}}
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
							<button onClick={() => {sendMessage(messagecontent);setValue("")}} disabled={messagecontent.length > 0 ? false : true} className="btn btn-primary" type="button" id="button_send_message">Send</button>
						</div>
					</div>
				</div>
				}
				{/* Modal create a channel */}
				<Modal show={modal_create_a_channel} onHide={()=>handleCloseModal_create_a_channel()}>
            <Modal.Header closeButton>
            <Modal.Title>Creer un channel</Modal.Title>
            </Modal.Header>
            <Modal.Body>

            <p>Nom du channel:</p>
            <input
				className="form-control"
				type="text"
				value={new_channel_name}
				onChange={(e) => {if(e.target.value.length < MAXLENGTH_CHANNEL){setNew_channel_name(e.target.value)}}}
				placeholder="Default input"
				aria-label="default input example"
				onKeyPress={(e) => {
					if (e.key.toString() === "Enter") {
						create_channel();handleCloseModal_create_a_channel()
					}
				}}
			/>
            <p>Type de channel:</p>
            <div className="form-check form-check-inline">
                <input className="form-check-input" checked={new_channel_type== "public" ? true : false} onChange={(e) => {setNew_channel_type("public")}} type="radio" name="inlineRadioOptions" id="privateMessageRadio1" value="option1"/>
                <label className="form-check-label" htmlFor="privateMessageRadio1">Public</label>
            </div>
            <div className="form-check form-check-inline">
                <input className="form-check-input" onChange={(e) => {setNew_channel_type("private")}} type="radio" name="inlineRadioOptions" id="inlineRadio2" value="option2"/>
                <label className="form-check-label" htmlFor="inlineRadio2">Privé</label>
            </div>
            <div className="form-check form-check-inline">
                <input className="form-check-input" onChange={(e) => {setNew_channel_type("password")}} type="radio" name="inlineRadioOptions" id="inlineRadio3" value="option3"/>
                <label className="form-check-label" htmlFor="inlineRadio3">Protegé par un mot de passe</label>
            </div>
            {
                new_channel_type === "password" &&
                <>
                    <p>Mot de passe:</p>
                    <input
						className="form-control"
						onChange={(e) => {if(e.target.value.length<MAXLENGTH_PASSWORD){setNew_channel_password(e.target.value)}}}
						type="text"
						placeholder="Default input"
						aria-label="default input example"
						onKeyPress={(e) => {
							if (e.key.toString() === "Enter") {
								create_channel();handleCloseModal_create_a_channel()
							}
						}}
					/>
                </>
            }
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={()=>{handleCloseModal_create_a_channel()}}>
                Close
            </Button>
            <Button variant="primary" onClick={()=>{create_channel();handleCloseModal_create_a_channel();}} disabled={new_channel_type == ''|| new_channel_name == '' ? true : false}>
                Creer
            </Button>
            </Modal.Footer>
        </Modal>
				{/* Modal add user*/}
				<Modal show={modal_invite_an_user_in_this_channel} onHide={()=>setModal_invite_an_user_in_this_channel(false)}>
            <Modal.Header closeButton>
            <Modal.Title>Inviter un user dans le channel {"["}{channels[selected_channel_id] ? channels[selected_channel_id].name : ""}{"]"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
				<ListGroup as="ol" numbered>
				{
					users_not_in_this_chan.map((user, i) => {
						return (
							<ListGroup.Item
								as="li"
								className="d-flex justify-content-between align-items-start"
							>
								<div className="ms-2 me-auto">
								<div className="fw-bold">{user.username}</div>
								</div>
								<Button variant="primary" disabled={user.is_invited ? true : false} onClick={()=>{sendInvitation_private_channel(user.ft_id)}}>Ajouter</Button>
							</ListGroup.Item>
						)
					})
				}
				</ListGroup>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={()=>setModal_invite_an_user_in_this_channel(false)}>
                Close
            </Button>
            </Modal.Footer>
        </Modal>
			</div>
			<div className="col">
				<div className="row" >
					Liste des utilisateurs de ce channel
				</div>
				<Table responsive="sm">
        <thead>
          <tr>
            <th>Username</th>
            <th>Actions</th>
            <th>Execution</th>
          </tr>
        </thead>
        <tbody>
					{
						users_in_this_chan[0] && users_in_this_chan.map((user_in_this_chan, i)=> {
							return (
								<tr style={{backgroundColor:user_in_this_chan.is_owner ? "red" : user_in_this_chan.is_admin ? "green" : ""}}>
									<td
										onClick={()=>navigate("/profile?id="+user_in_this_chan.ft_id)}
										style={{cursor: "pointer"}}
									>
										{user_in_this_chan.username}{" "}
									</td>
									<td>
									<Form.Select aria-label="Default select example" onChange={(e)=>{click_on_action(parseInt(e.target.value), user_in_this_chan.ft_id)}}>
										<option value="1">Défier {"(mode facile)"}</option>
										<option value="2">Défier {"(mode difficile)"}</option>
										<option value="3" disabled={selected_channel_id > -1 && channels[selected_channel_id].is_admin && !user_in_this_chan.is_owner ? false : true}>Mute</option>
										<option value="4" disabled={selected_channel_id > -1 && channels[selected_channel_id].is_admin && !user_in_this_chan.is_owner ? false : true}>{user_in_this_chan.is_banned ? "unban" : "Ban"}</option>
										<option value="5" disabled={selected_channel_id > -1 && channels[selected_channel_id].is_owner && !user_in_this_chan.is_owner ? false : true}>giveAdminRole</option>
									</Form.Select>
									</td>
									<td>
										<Button
											disabled={user_in_this_chan.action <= 0 ? true : false}
											onClick={()=>{
												if (user_in_this_chan.action === 1)
												{
													invite_to_game(user_in_this_chan.ft_id)
												}
												else if (user_in_this_chan.action === 2)
												{
													invite_to_hard_game(user_in_this_chan.ft_id)
												}
												else if (user_in_this_chan.action === 3)
												{
													setSelectedUser(user_in_this_chan)
													setModal_mute_time(true)
												}
												else if (user_in_this_chan.action === 4)
												{
													if (user_in_this_chan.is_banned)
														unban_user(user_in_this_chan.ft_id)
													else
														ban_user(user_in_this_chan.ft_id)
												}
												else if (user_in_this_chan.action === 5)
												{
													giveAdminRole(user_in_this_chan.ft_id)
												}
											}}
											variant="primary"
										>
											Executer
										</Button>
									</td>
								</tr>
							)
						})
					}
					</tbody>
				  </Table>
			</div>

				{/* Modal add_password_to_channel */}
		<Modal show={modal_add_password_to_channel} onHide={()=>setModal_add_password_to_channel(false)}>
            <Modal.Header closeButton>
            <Modal.Title>Actualiser le password du channel {"["}{channels[selected_channel_id] ? channels[selected_channel_id].name : ""}{"]"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
				<Form.Label htmlFor="inputAdd_password_to_channel">Password</Form.Label>
				<Form.Control
				type="password"
				id="inputAdd_password_to_channel"
				aria-describedby="passwordHelpBlock"
				onChange={(e)=>{if(e.target.value.length<MAXLENGTH_PASSWORD){setAdd_password_to_channel(e.target.value)}}}
				value={add_password_to_channel}
				onKeyPress={(e) => {
					if (e.key.toString() === "Enter") {
						_add_password_to_channel();handleCloseModal_add_password_to_channel()
					}
				}}
				/>
				<br/>
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={()=>handleCloseModal_add_password_to_channel()}>
                Close
            </Button>
            <Button variant="primary" onClick={()=>{_add_password_to_channel();handleCloseModal_add_password_to_channel();}}>
                Ajouter
            </Button>
            </Modal.Footer>
        </Modal>
		{/* Modal time mute */}
		<Modal show={modal_mute_time} onHide={()=>handleCloseModal_mute_time()}>
            <Modal.Header closeButton>
            <Modal.Title>Mute le user {"["}{selected_user.username}{"]"}du channel {"["}{channels[selected_channel_id] ? channels[selected_channel_id].name : ""}{"]"}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
				<MDBInput
					label='Minutes de bloquage'
					value={mute_time}
					type='number'
					onChange={(e)=>{if(e.target.value.length > 0 && e.target.value.length < MAX_MUTE_TIME){setMute_time(parseInt(e.target.value))}}}
					onKeyPress={(e) => {
						if (e.key.toString() === "Enter") {
							mute_user(selected_user.ft_id);handleCloseModal_mute_time();
						}
					}}
				/>
				{
					(mute_time < 1 || mute_time > MAX_MUTE_TIME) &&
						<p style={{color:"red"}}>Vous pouvez mute un user pendant 1 à 525 000 minutes {"(un an)"}</p>
				}
            </Modal.Body>
            <Modal.Footer>
            <Button variant="secondary" onClick={()=>handleCloseModal_mute_time()}>
                Close
            </Button>
            <Button variant="primary" onClick={()=>{mute_user(selected_user.ft_id);handleCloseModal_mute_time();}} disabled={mute_time < 1 || mute_time > MAX_MUTE_TIME ? true : false}>
                Mute
            </Button>
            </Modal.Footer>
        </Modal>
    	</div>
		</>
    );
}