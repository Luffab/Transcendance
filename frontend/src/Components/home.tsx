import axios from "axios";
import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import React from 'react'
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export interface friendDTO {
	ft_id: string;
	username: string;
	status: string
}

export interface waitFriendDTO {
	ft_id: string;
	username: string;
}

export interface gameInviteDTO {
	sender_username: string;
	sender_id: string
	mode: string
}

export interface errorDTO {
	status: string
	message: string
}

export interface friendRequestDTO {
	ft_id: string;
	username: string
}

export default function Home() {
	const dispatch = useDispatch();
  const navigate = useNavigate();

  const [friends, setFriends] = useState<friendDTO[]>([])
  const [wait_friends, setWaitFriends] = useState<waitFriendDTO[]>([])
  const [mouse_over_user, setMouse_over_user] = useState({id:-1, type:""})
  const [game, setGame] = useState<gameInviteDTO[]>([])
  const [error, setError] = useState("")

  const {ip} = useSelector((state: any) => ({
	...state.ConfigReducer
}))
const {socket} = useSelector((state: any) => ({
	...state.ConfigReducer
  }))

  useEffect(() => {
	dispatch(
		{
			type:"ACTUAL_PAGE",
			actual_page: "home"
		})
}, [])

	function deleteWaitFriends(request: string) {
		let tab: waitFriendDTO[]
		tab = [];
		wait_friends.map((wait_friend, i) => {
			if (wait_friend.ft_id !== request)
				tab.push(wait_friend)
		})
		setWaitFriends(tab)
	}

	function deleteGames(request: string) {
		let tab: gameInviteDTO[]
		tab = [];
		game.map((games, i) => {
			if (games.sender_id !== request)
				tab.push(games)
		})
		setGame(tab)
		let url='http://'+ip+':3001/api/game/delete_invite'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"sender_id": request
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

	function deleteWaitFriendsForBlock(request: string) {
		let tab: waitFriendDTO[]
		tab = [];
		wait_friends.map((wait_friend, i) => {
			if (wait_friend.ft_id !== request)
				tab.push(wait_friend)
		})
		setWaitFriends(tab)
	}

	function deleteFriends(request: string) {
		let tab: friendDTO[];
		tab = []
		friends.map((friend: friendDTO, i) => {
			if (friend.ft_id !== request)
				tab.push(friend)
		})
		setFriends(tab)
	}

	const AnswerFriendRequest = (value: boolean, req_id: string) => {
		let friend = {
			token: localStorage.getItem("token_transcandence"),
			friend_id: req_id,
			answer: value
		}
		socket?.emit("friendRequestResponse", friend)
	}

	const AnswerGameRequest = (value: boolean, req_id: string, mode: string) => {
		let game = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id,
			ownerId: req_id
		}
		if (value === true) {
			socket?.emit("joinPrivateGame", game)
			navigate('/private_game?mode='+mode)
		}
		deleteGames(req_id)
		
	}

	const waitFriendListener = (request: waitFriendDTO) => {
		let x = 0;
		let tab: waitFriendDTO[]
		tab = []
		for (let i = 0; i < wait_friends.length; i++) {
			tab[x] = wait_friends[i]
			x++;
		}
		tab[x] = request
		setWaitFriends([request, ...wait_friends])
	}

	const friendListener = (request: friendDTO) => {
		let x = 0;
		let tab: friendDTO[];
		tab = []
		for (let i = 0; i < friends.length; i++) {
			tab[x] = friends[i]
			x++;
		}
		tab[x] = request
		setFriends([request, ...friends])
	}

	const myFriendRequest = (request: friendDTO) => {
		let x = 0;
		let tab: friendDTO[];
		tab = []
		for (let i = 0; i < friends.length; i++) {
			tab[x] = friends[i]
			x++;
		}
		tab[x] = request
		setFriends([request, ...friends])
		deleteWaitFriends(request.ft_id)
	}

	const isInTab = (tab: gameInviteDTO[], id: string) => {
		for (let i = 0; i < tab.length; i++) {
			if (tab[i].sender_id === id)
				return true;
		}
		return false
	} 

	const gameRequest = (request: gameInviteDTO) => {
		if (!isInTab(game, request.sender_id))
			setGame([request, ...game])
	}

	const myFriendRequestFailed = (request: friendDTO) => {
		deleteWaitFriends(request.ft_id)
	}

	const removeFriendRequest = (request: friendDTO) => {
		deleteFriends(request.ft_id)
		deleteWaitFriends(request.ft_id)
	}


	useEffect(() => {
		socket?.on("receiveFriendRequest", waitFriendListener)
		return () => {
			socket?.off("receiveFriendRequest", waitFriendListener)
		}
	}, [waitFriendListener])

	useEffect(() => {
		socket?.on("newGameInvitation", gameRequest)
		return () => {
			socket?.off("newGameInvitation", gameRequest)
		}
	}, [gameRequest])

	useEffect(() => {
		socket?.on("receiveBlock", deleteWaitFriendsForBlock)
		return () => {
			socket?.off("receiveBlock", deleteWaitFriendsForBlock)
		}
	}, [deleteWaitFriendsForBlock])

	useEffect(() => {
		socket?.on("receiveMyFriendRequestFailed", myFriendRequestFailed)
		return () => {
			socket?.off("receiveMyFriendRequestFailed", myFriendRequestFailed)
		}
	}, [myFriendRequestFailed])

	useEffect(() => {
		socket?.on("receiveMyFriendRequestAnswer", myFriendRequest)
		return () => {
			socket?.off("receiveMyFriendRequestAnswer", myFriendRequest)
		}
	}, [myFriendRequest])

	useEffect(() => {
		socket?.on("removeFriendRequest", removeFriendRequest)
		return () => {
			socket?.off("removeFriendRequest", removeFriendRequest)
		}
	}, [removeFriendRequest])

	useEffect(() => {
		socket?.on("receiveFriendRequestAnswer", friendListener)
		return () => {
			socket?.off("receiveFriendRequestAnswer", friendListener)
		}
	}, [friendListener])

	const errorMessage = (newMessage: string) => {
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
		socket?.on("receiveError", errorMessage)
		return () => {
			socket?.off("receiveError", errorMessage)
		}
	}, [errorMessage])

	const receiveSuccess = (newMessage: string) => {
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

	const getFriends = () => {
		let url = 'http://'+ip+':3001/api/users/friends?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			setFriends(res.data)
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

	const getGames = () => {
		let url = 'http://'+ip+':3001/api/game/private_game?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			setGame(res.data)
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

	const getWaitFriends = () => {
		let url = 'http://'+ip+':3001/api/users/wait_friends?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			setWaitFriends(res.data)
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

	const spectate = (id: string) => {
		let game = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id,
			friendId: id
		}
		socket?.emit("spectateGame", game)
		navigate('/spectate')
	}

	useEffect(() => {
		getFriends(),
		getWaitFriends()
		getGames()
	}, [])

    return (
      <>
        <h1 style={{textAlign: "center", marginTop: "50px", fontWeight: "bold", fontSize: "100px"}}>PONG THE GAME</h1>
			{
				friends[0] &&
				(
					<h2 style={{textAlign: "center", marginTop: "50px", textDecoration: "underline"}}>Amis</h2>
				) || !friends[0] &&
				(
					<h2 style={{textAlign: "center", marginTop: "50px", fontWeight: "bold"}}>TU N'AS PAS D'AMIS &#128514;</h2>
				)
			}
			{
				friends[0] &&
				(
					<table style={{marginBottom: "50px", width: "50%", margin: "auto", textAlign: "center"}}>
						<thead>
            	   			<tr>
            	   				<th scope="col" style={{textDecoration: "underline"}}>Pseudo</th>
            	   				<th scope="col" style={{textDecoration: "underline"}}>Status</th>
            	   			</tr>
          				</thead>
						{
							friends.map((friend, i) => {
								return(
									<tbody key={i}>
										<tr>
											<td scope="row"><span  onClick={() => navigate("/profile?id="+friend.ft_id)}
											onMouseOver={()=>{setMouse_over_user({id:i, type:"username"})}}
											onMouseOut={()=>{setMouse_over_user({id:-1, type:""})}}
											style={{
												textDecoration: mouse_over_user.type == "username" && mouse_over_user.id == i ? "underline" : "none",
												cursor: "pointer",
												color: mouse_over_user.type === "username" && mouse_over_user.id == i ? "blue" : "black"
											}}>{friend.username}</span></td>
											{
												friend.status === "Online" &&
												(
													<td><span className="badge text-bg-success">{' '}</span>{' '}{friend.status}</td>
												) || friend.status === "Offline" &&
												(
													<td><span className="badge text-bg-danger">{' '}</span>{' '}{friend.status}</td>
												) || friend.status === "In Game" &&
												(
														<td><span className="badge text-bg-success">{' '}</span>{' '}{friend.status + " "}
														<button className="btn btn-primary" onClick={() => spectate(friend.ft_id)}>Regarder{' '}</button>{" "}</td>
												)
											}
										</tr>
									</tbody>
								)
							})
						}
					</table>
				)
			}
			{
				wait_friends[0] &&
				(
					<h2 style={{textAlign: "center", marginTop: "50px", textDecoration: "underline"}}>Demandes d'amis</h2>
				)
			}
			{
				wait_friends[0] &&
				(
					<table style={{marginBottom: "50px", width: "50%", margin: "auto", textAlign: "center"}}>
						<thead>
            	   			<tr>
            	   				<th scope="col" style={{textDecoration: "underline"}}>Pseudo</th>
            	   				<th scope="col" style={{textDecoration: "underline"}}>Accept</th>
								<th scope="col" style={{textDecoration: "underline"}}>Refuse</th>
            	   			</tr>
          				</thead>
						{
							wait_friends.map((friends, i) => {
								return(
									<tbody key={i}>
										<tr>
											<td scope="row">{friends.username}</td>
											<td><button type="button" className="btn btn-outline-secondary" style={{height: "60px", width: "100px", backgroundColor: "green", color: "white"}} onClick={() => {AnswerFriendRequest(true, friends.ft_id)}}>Accepter</button></td>
											<td><button type="button" className="btn btn-danger btn-sm" style={{height: "60px", width: "100px"}} onClick={() => {AnswerFriendRequest(false, friends.ft_id)}}>Refuser</button></td>
										</tr>
									</tbody>
								)
							})
						}
					</table>
				)
			}
			{
				game[0] &&
				(
					<h2 style={{textAlign: "center", marginTop: "50px", textDecoration: "underline"}}>Invitations de parties</h2>
				)
			}
			{
				game[0] &&
				(
					<table style={{marginBottom: "50px", width: "50%", margin: "auto", textAlign: "center"}}>
						<thead>
							<tr>
								<th scope="col" style={{textDecoration: "underline"}}>Pseudo</th>
								<th scope="col" style={{textDecoration: "underline"}}>Accept</th>
								<th scope="col" style={{textDecoration: "underline"}}>Refuse</th>
							</tr>
						</thead>
					{
						game.map((games, i) => {
							return (
								<tbody key={i}>
									<tr>
										<td scope="row">{games.sender_username}</td>
										<td><button type="button" className="btn btn-outline-secondary" style={{height: "60px", width: "100px", backgroundColor: "green", color: "white"}} onClick={() => {AnswerGameRequest(true, games.sender_id, games.mode)}}>Accepter</button></td>
										<td><button type="button" className="btn btn-danger btn-sm" style={{height: "60px", width: "100px"}} onClick={() => {AnswerGameRequest(false, games.sender_id, games.mode)}}>Refuser</button></td>
									</tr>
								</tbody>
							)
						})
					}
					</table>
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