import axios from "axios";
import { useEffect, useState } from "react"
import {
	MDBCol,
	MDBContainer,
	MDBRow,
	MDBCard,
	MDBCardText,
	MDBCardBody,
	MDBCardImage,
  } from 'mdb-react-ui-kit';
  import { useSelector, useDispatch } from 'react-redux';
  import jwt_decode from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

export interface userDTO {
	username: string
	avatar: string
	one_party_played: boolean
	one_victory: boolean
	ten_victory: boolean
	nb_victory: number
	nb_defeat: number
	lvl: number
	rank: string
}

export interface historyDTO {
	p1Score: number
	p2Score: number
	is_win: boolean
	mode: string
	opp_username: string
	opp_id: string
}

export default function Profile() {

	let initial_data = {
	username: "",
	avatar: "",
	one_party_played: false,
	one_victory: false,
	ten_victory: false,
	nb_victory: 0,
	nb_defeat: 0,
	lvl: 0,
	rank: "",
	}

    const [user_info, setUser_info] = useState<userDTO>(initial_data)
	const [ft_id, setFtid] = useState("")
	const [error, setError] = useState(false)
	const [is_usr_block, setUsrBlock] = useState(false)
	const [is_usr_friend, setUsrFriend] = useState(false)
	const [is_usr_waiting_friend, setUsrWaitFriend] = useState(false)
	const [game_history, setGameHistory] = useState<historyDTO[]>([])
	const [mouse_over_user, setMouse_over_user] = useState({id:-1, type:""})
	const [isuser, setIsUser] = useState(true)
	const {ip} = useSelector((state: any) => ({
		...state.ConfigReducer
	}))
	const {socket} = useSelector((state: any) => ({
		...state.ConfigReducer
	}))
	const navigate = useNavigate();
	const dispatch = useDispatch();
	useEffect(() => {
		  dispatch(
			  {
				  type:"ACTUAL_PAGE",
				  actual_page: "profile"
			  })
	  }, [])

	const receiveNotif = (newMessage: string) => {
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
		socket?.on("notification", receiveNotif)
		return () => {
			socket?.off("notification", receiveNotif)
		}
	}, [receiveNotif])

	const blockUser = () => {
		let json = {
			"token": localStorage.getItem("token_transcandence"),
			"block_id": id
		}
		socket?.emit("blockUser", json)
		setUsrBlock(true)
		setUsrWaitFriend(false)
	}

	const deblockUser = () => {
		let url='http://'+ip+':3001/api/users/deblock_user'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"block_id": id
		}
		)
		.then(() => {
			setUsrBlock(false)
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

	const SendFriendRequest = () => {
		let friend = {
			token: localStorage.getItem("token_transcandence"),
			friend_id: id
		}
		setUsrWaitFriend(true)
		socket?.emit("sendFriendRequest", friend)
	}

	const SendRemoveRequest = () => {
		let friend = {
			token: localStorage.getItem("token_transcandence"),
			friend_id: id
		}
		setUsrFriend(false)
		socket?.emit("removeFriend", friend)
	}

	const decodeToken = () => {
		let res = localStorage.getItem("token_transcandence")
		let decoded: any;
		if (res != null)
			decoded = jwt_decode(res);
		setFtid(decoded.ft_id);
	}

    const queryParameters = new URLSearchParams(window.location.search)
    let id = queryParameters.get("id")

	const user = () => {
		let url = 'http://'+ip+':3001/api/users/user_information?token='+localStorage.getItem("token_transcandence")+'&id='+id;
		axios.get(url)
		.then(res => {
			setIsUser(true)
			setUser_info(res.data)
		})
		.catch((error) =>{
			setIsUser(false)
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

	const getblock_user = () => {
		let url = 'http://'+ip+':3001/api/users/is_block?token='+localStorage.getItem("token_transcandence")+'&id='+id;
		axios.get(url)
		.then(res => {
			setUsrBlock(res.data)
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

	const getgamehistory = () => {
		let url = 'http://'+ip+':3001/api/users/get_game_history?token='+localStorage.getItem("token_transcandence")+'&id='+id;
		axios.get(url)
		.then(res => {
			setGameHistory(res.data)
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

	const getfriend_user = () => {
		let url = 'http://'+ip+':3001/api/users/is_friend?token='+localStorage.getItem("token_transcandence")+'&id='+id;
		axios.get(url)
		.then(res => {
			setUsrFriend(res.data)
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

	const getwaitingfriend_user = () => {
		let url = 'http://'+ip+':3001/api/users/is_waiting_friend?token='+localStorage.getItem("token_transcandence")+'&id='+id;
		axios.get(url)
		.then(res => {
			setUsrWaitFriend(res.data)
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

	function onMouseEnterButtonHandler (e: any) {
		e.target.style.backgroundColor = '#006400'
	  };

	function onMouseLeaveButtonHandler (e: any) {
		e.target.style.backgroundColor = 'green'
	};

	const removeFriendRequest = () => {
		setUsrFriend(false)
		setUsrWaitFriend(false)
	}

	  const myFriendRequest = () => {
		  setUsrFriend(true)
		  setUsrWaitFriend(false)
	  }

	  const myFriendRequestFailed = () => {
		setUsrFriend(false)
		setUsrWaitFriend(false)
	}

	const waitFriendListener = () => {
		setUsrFriend(false)
		setUsrWaitFriend(true)
	}

	const blockError = () => {
		setUsrFriend(false)
		setUsrWaitFriend(false)
	}

	useEffect(() => {
		socket?.on("receiveBlockedError", blockError)
		return () => {
			socket?.off("receiveBlockedError", blockError)
		}
	}, [blockError])

	useEffect(() => {
		socket?.on("removeFriendRequest", removeFriendRequest)
		return () => {
			socket?.off("receiveMyFriendRequestAnswer", removeFriendRequest)
		}
	}, [removeFriendRequest])

	  useEffect(() => {
		socket?.on("receiveMyFriendRequestAnswer", myFriendRequest)
		return () => {
			socket?.off("receiveMyFriendRequestAnswer", myFriendRequest)
		}
	}, [myFriendRequest])

	useEffect(() => {
		socket?.on("receiveFriendRequestAnswer", myFriendRequest)
		return () => {
			socket?.off("receiveFriendRequestAnswer", myFriendRequest)
		}
	}, [myFriendRequest])

	useEffect(() => {
		socket?.on("receiveMyFriendRequestFailed", myFriendRequestFailed)
		return () => {
			socket?.off("receiveMyFriendRequestFailed", myFriendRequestFailed)
		}
	}, [myFriendRequestFailed])

	useEffect(() => {
		socket?.on("receiveFriendRequest", waitFriendListener)
		return () => {
			socket?.off("receiveFriendRequest", waitFriendListener)
		}
	}, [waitFriendListener])

	useEffect(() => {
		socket?.on("removeFriend", removeFriendRequest)
		return () => {
			socket?.off("removeFriend", removeFriendRequest)
		}
	}, [removeFriendRequest])

	useEffect(() => {
		user(),
		decodeToken(),
		getblock_user(),
		getfriend_user(),
		getwaitingfriend_user(),
		getgamehistory()
	}, [id])

        return (
        <>
		{
			isuser === true &&
			(
				<section>
					{
						ft_id != id && !is_usr_block &&
						(
							<div>
								<button type="button" className="btn btn-danger btn-sm" style={{float: "right", height: "60px", width: "100px", margin: "5px"}} onClick={() => {blockUser()}}>Bloquer</button>
							</div>
						) || ft_id != id && is_usr_block &&
						(
							<div>
								<button type="button" className="btn btn-danger btn-sm" style={{float: "right", height: "60px", width: "100px", margin: "5px"}} onClick={() => {deblockUser()}}>Debloquer</button>
							</div>
						) || ft_id === id &&
						(
							<button className="btn btn-primary" style={{float: "right", height: "60px", width: "120px", margin: "5px"}} onClick={()=>navigate("/update_profil")}>Modifier mon profil</button>
						)
					}
					{
						ft_id != id && !is_usr_friend && !is_usr_waiting_friend && !is_usr_block &&
						(
							<div>
								<button type="button" className="btn btn-outline-secondary" style={{margin: "5px", float: "right", height: "60px", width: "100px", backgroundColor: "green", color: "white"}}  onMouseEnter={onMouseEnterButtonHandler} onMouseLeave={onMouseLeaveButtonHandler} onClick={() => {SendFriendRequest()}}>Ajouter en ami</button>
							</div>
						) || ft_id != id && is_usr_friend && !is_usr_waiting_friend && !is_usr_block &&
						(
							<div>
								<button type="button" className="btn btn-outline-secondary" style={{margin: "5px", float: "right", height: "60px", width: "100px", backgroundColor: "green", color: "white"}} onClick={() => {SendRemoveRequest()}}>Enlever des amis</button>
							</div>
						) || ft_id != id && is_usr_waiting_friend && !is_usr_friend && !is_usr_block &&
						(
							<div>
								<button type="button" className="btn btn-outline-secondary" style={{margin: "5px", float: "right", height: "60px", width: "100px", backgroundColor: "green", color: "white"}}>En attente...</button>
							</div>
						)
					}
			<MDBContainer className="py-5">
			
			<MDBRow>
			<MDBCol lg="4">
				<MDBCard className="mb-4" style={{ backgroundColor: '#eee' }}>
				<MDBCardBody className="text-center">
					<MDBCardImage
					src={user_info.avatar}
					alt="avatar"
					className="rounded"
					style={{ width: '100%' }}
					fluid />
				</MDBCardBody>
				</MDBCard>
			</MDBCol>

			<MDBCol lg="8">
				<MDBCard className="mb-4" style={{ backgroundColor: '#eee' }}>
				<MDBCardBody>
					<MDBRow>
					<MDBCol sm="3">
						<MDBCardText style={{ fontWeight: 'bold' }}>Username</MDBCardText>
					</MDBCol>
					<MDBCol sm="9">
						<MDBCardText>{user_info.username}</MDBCardText>
					</MDBCol>
					</MDBRow>
					<hr />
					<MDBRow>
					<MDBCol sm="3">
						<MDBCardText style={{ fontWeight: 'bold' }}>Rank</MDBCardText>
					</MDBCol>
					<MDBCol sm="9">
						<MDBCardText>{user_info.rank}</MDBCardText>
					</MDBCol>
					</MDBRow>
					<hr />
					<MDBRow>
					<MDBCol sm="3">
						<MDBCardText style={{ fontWeight: 'bold' }}>Level</MDBCardText>
					</MDBCol>
					<MDBCol sm="9">
						<MDBCardText>{user_info.lvl}</MDBCardText>
					</MDBCol>
					</MDBRow>
					<hr />
					<MDBRow>
					<MDBCol sm="3">
						<MDBCardText style={{ fontWeight: 'bold' }}>Victories</MDBCardText>
					</MDBCol>
					<MDBCol sm="9">
						<MDBCardText>{user_info.nb_victory}</MDBCardText>
					</MDBCol>
					</MDBRow>
					<hr />
					<MDBRow>
					<MDBCol sm="3">
						<MDBCardText style={{ fontWeight: 'bold' }}>Defeats</MDBCardText>
					</MDBCol>
					<MDBCol sm="9">
						<MDBCardText>{user_info.nb_defeat}</MDBCardText>
					</MDBCol>
					</MDBRow>
				</MDBCardBody>
				</MDBCard>

				<MDBRow>
				<MDBCol md="6">
					<MDBCard className="mb-4 mb-md-0" style={{ backgroundColor: '#eee' }}>
					<MDBCardBody>
						<MDBCardText className="mb-4" style={{ fontSize: '150%', fontWeight: 'bold' }}>Achievements</MDBCardText>
						<MDBCardText className="mb-1" style={{color:user_info.one_party_played ? "green" : "red"}}>One Party Played</MDBCardText>
						<MDBCardText className="mb-1" style={{color:user_info.one_victory ? "green" : "red"}}>Win One Party</MDBCardText>
						<MDBCardText className="mb-1" style={{color:user_info.ten_victory ? "green" : "red"}}>Win 10 Parties</MDBCardText>
					</MDBCardBody>
					</MDBCard>
				</MDBCol>

				<MDBCol md="6">
					<MDBCard className="mb-4 mb-md-0" style={{ backgroundColor: '#eee' }}>
					<MDBCardBody>
						<MDBCardText className="mb-4" style={{ fontSize: '150%', fontWeight: 'bold' }}>Game History</MDBCardText>
						{
							game_history.map((history: historyDTO, i) => {
								return(
									<MDBRow
										style={{backgroundColor:history.is_win ? "#20FF19" : "#FF4D27"}}
										key={i}
									>
										<MDBCol sm="1">
											<MDBCardText>{history.p1Score}</MDBCardText>
										</MDBCol>
										<MDBCol sm="4">
											<MDBCardText>{history.p2Score}</MDBCardText>
										</MDBCol>
										<MDBCol sm="7">
											<MDBCardText onClick={() => navigate("/profile?id="+history.opp_id)}
											onMouseOver={()=>{setMouse_over_user({id:i, type:"username"})}}
											onMouseOut={()=>{setMouse_over_user({id:-1, type:""})}}
											style={{
												textDecoration: mouse_over_user.type === "username" && mouse_over_user.id == i ? "underline" : "none",
												cursor: "pointer",
												display:"inline",
												color: mouse_over_user.type === "username" && mouse_over_user.id == i ? "blue" : "black"
											}}>{history.opp_username}</MDBCardText>
										</MDBCol>
									</MDBRow>
								)
							})
						}
					</MDBCardBody>
					</MDBCard>
				</MDBCol>
				</MDBRow>
			</MDBCol>
			</MDBRow>
		</MDBContainer>

		</section>
			) || isuser === false && (<h1>Access Forbidden</h1>)
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

  