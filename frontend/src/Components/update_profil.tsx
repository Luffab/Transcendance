import axios from "axios";
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

const MAXLENGTH_USERNAME = 20;
const MAXLENGTH_PICTURE = 10485760;

export interface blockListDTO {
	ft_id: string
	username: string
}

export default function Update_Profil() {
	const [username, setUsername] = useState("");
	const [avatar, setAvatar] = useState("");
	const [blocked, setBlocked] = useState<blockListDTO[]>([])
	const [tfa, setTfa] = useState();
	const [email, setEmail] = useState("")
	const [recup_email, setRecupEmail] = useState("")
	const [ismail, setIsMail] = useState(false)
	const [userError, setUserError] = useState("")
	const {ip} = useSelector((state: any) => ({
		...state.ConfigReducer
	}))
	const dispatch = useDispatch();
	useEffect(() => {
		  dispatch(
			  {
				  type:"ACTUAL_PAGE",
				  actual_page: "update_profil"
			  })
	  }, [])
	const user = () => {
		let url = 'http://'+ip+':3001/api/users/my_info?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			if (res.data.status == "KO")
				setUserError(res.data.message)
			else {
				setUsername(res.data.username);
				setAvatar(res.data.avatar)
				setTfa(res.data.is2fa)
				setEmail(res.data.email)
				if (res.data.email)
					setIsMail(true)
				setRecupEmail(res.data.recup_emails)
			}
		})
	}

	const users_blocked = () => {
		let url = 'http://'+ip+':3001/api/users/blocked_users?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			if (res.data.status == "KO")
				setUserError(res.data.message)
			else
				setBlocked(res.data)
		})
		.catch((error) => {
		})
	}

	function deleteBlockedUser(user_id: string) {
		let tab: blockListDTO[]
		tab = [];
		blocked.map((block: blockListDTO, i) => {
			if (block.ft_id !== user_id)
				tab.push(block)
		})
		setBlocked(tab)
	}

	const deblockUser = (user_id: string) => {
		let url='http://'+ip+':3001/api/users/deblock_user'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"block_id": user_id
		}
		)
		.then(response => {
			if (response.data.status === "OK")
				deleteBlockedUser(user_id)
		})
		.catch((error) => {
		})
	}

	const changeUsername = () => {
		let url='http://'+ip+':3001/api/users/change_username'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"username": username
		}
		)
		.then(response => {})
		.catch((error) => {
		})
	}

	const changeEmail = () => {
		let url='http://'+ip+':3001/api/users/change_email'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"email": email
		}
		)
		.then(response => {
			if (email === "") {
				setIsMail(false)
				change2fa(false)
			}
			else
				setIsMail(true)
		})
		.catch((error) => {
		})
	}

	const changeAvatar = (post: string) => {
		let url='http://'+ip+':3001/api/users/change_avatar'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"image": post
		}
		)
		.then(response => {
			console.log(post)
			setAvatar(response.data.avatar)
		})
		.catch((error) => {
		})
	}

	const change2fa = (e: boolean) => {
		let url='http://'+ip+':3001/api/auth/2fa/change'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"is_2fa": e
		}
		)
		.then(response => {
			setTfa(response.data.is2fa)
		})
		.catch((error) => {
		})
	}

	const createPost = async (post: string) => {
		try {
		  await changeAvatar(post);
		} catch (error) {
		}
	  };
	
	  const handleSubmit = (e: any) => {
		e.preventDefault();
		if(avatar.length < MAXLENGTH_PICTURE)
			createPost(avatar);
		else
			toast.error("La taille de la photo est trop grande, reduisez sa taille et re-essayez", {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: "light",
				});
	  };


	const convertToBase64 = (file: any) => {
		return new Promise((resolve, reject) => {
		  const fileReader = new FileReader();
		  fileReader.readAsDataURL(file);
		  fileReader.onload = () => {
			resolve(fileReader.result);
		  };
		  fileReader.onerror = (error) => {
			reject(error);
		  };
		});
	  };

	  const handleFileUpload = async (e: any) => {
		console.log(e.target.files[0].size)
		if (e.target.files[0].size > 0)
		{
			const file = e.target.files[0];
			let base64: any
			base64 = await convertToBase64(file);
			if (base64.length < MAXLENGTH_PICTURE)
			{
				console.log("CONVERT")
				setAvatar(base64);
			}
		}
	  };


	  useEffect(() => {
		user(),
		users_blocked()
	}, [])
    return (
		<>
        <h1 style={{textAlign: 'center'}}>Modifier mon profil</h1>
        <h3>Nom d'utilisateur:</h3>
        <div className="input-group mb-3" style={{width: "300px"}}>
            <input onChange={(e)=>{if(e.target.value.length < MAXLENGTH_USERNAME){setUsername(e.target.value)}}} value={username} id="input_modify_username" type="text" className="form-control" aria-describedby="button_modify_username"/>
            <button className="btn btn-outline-secondary" type="button" id="button_modify_username" onClick={()=>{changeUsername();}}>Modifier</button>
        </div>
        <h3>Modifier ma photo de profil:</h3>
        <img src={avatar} className="img-thumbnail" alt="..." style={{width: '15%'}}></img>
        <div className="mb-3">
            <label htmlFor="formFile" className="form-label"></label>
            <form onSubmit={handleSubmit}>
        		<input
        		  type="file"
        		  name="myFile"
        		  accept=".jpeg, .png, .jpg"
        		  onChange={(e) => handleFileUpload(e)}
        		/>
				<button className="btn btn-outline-secondary">Modifier</button>
    		</form>
        </div>
		<div>
			{
				recup_email &&
				(
					<div>
						<h3>Changer l'adresse email</h3>
						<div className="input-group mb-3" style={{width: "300px"}}>
            				<input onChange={(e)=>setEmail(e.target.value)} value={email} id="input_modify_email" type="text" className="form-control" aria-describedby="button_modify_email"/>
            				<button className="btn btn-outline-secondary" type="button" id="button_modify_email" onClick={()=>{changeEmail();}}>Modifier</button>
						</div>
					</div>
				)
			}
		</div>
		{
			recup_email && ismail &&
			(
				<div>
        			<h3>Authentification à deux facteurs:</h3> 
        			<div className="form-check form-switch">
        			    <input className="form-check-input" type="checkbox" role="switch" id="flexSwitchCheckDefault" defaultChecked={tfa} onClick={() => change2fa(!tfa)} style={{height: "20px", width: "50px"}}/>
       				</div>
				</div>
			) ||
			(
				<h4>Pour activer la 2fa, entrez une adresse mail ci-dessus</h4>
			)
		}
		{
			blocked[0] &&
			(
				<h3>Liste des joueurs bloqués:</h3>
			)
		}
		{
			blocked[0] &&
			(
				<ul className="list-group" style={{width: "20%"}}>
					{
						blocked.map((block, i) => {
							return(
								<li className="list-group-item">
									<div className="row">
										<div className="col">
											{block.username}
										</div>
										<div className="col" style={{textAlign: 'center'}}>
											<button type="button" className="btn btn-danger btn-sm" onClick={() => {deblockUser(block.ft_id)}}>Débloquer</button>
										</div>
									</div>
								</li>
							)
						})
					}
				</ul>
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