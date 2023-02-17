import axios from "axios";
import { useEffect, useState } from "react"
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

const MAXLENGTH_USERNAME = 20;
const MAXLENGTH_PICTURE = 10485760;
const MAXLENGTH_EMAIL = 254

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
	const [tmpAvatar, setTmpAvatar] = useState("")
	const [isAvatarUpdate, setAvatarUpdate] = useState(false)
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
			setUsername(res.data.username);
			setAvatar(res.data.avatar)
			setTmpAvatar(res.data.avatar)
			setTfa(res.data.is2fa)
			setEmail(res.data.email)
			if (res.data.email)
				setIsMail(true)
			setRecupEmail(res.data.recup_emails)
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

	const users_blocked = () => {
		let url = 'http://'+ip+':3001/api/users/blocked_users?token='+localStorage.getItem("token_transcandence");
		axios.get(url)
		.then(res => {
			setBlocked(res.data)
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
			deleteBlockedUser(user_id)
			toast.success("The user was deblock", {
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

	const changeUsername = () => {
		let url='http://'+ip+':3001/api/users/change_username'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"username": username
		}).then(() => {
			toast.success("Username was changed", {
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

	const changeEmail = () => {
		let url='http://'+ip+':3001/api/users/change_email'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"email": email
		}
		)
		.then(() => {
			if (email === "") {
				setIsMail(false)
				change2fa(false)
				toast.success("Email was deleted", {
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
			else {
				setIsMail(true)
				toast.success("Email was changed", {
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

	function isImage(data: string){
		let knownTypes: any = {
		  '/': 'data:image/jpeg;base64,',
		  'i': 'data:image/png;base64,',
		}
		  
		let image = new Image()
		
		let i = data.search(",")
		if(!knownTypes[data[i + 1]]) {
			return false;
		}
		else {
			image.src = knownTypes[0]+data
			image.onload = function(){
			  //This should load the image so that you can actually check
			  //height and width.
			  if(image.height === 0 || image.width === 0){
				return false;
			  }
		  	}
		  return true;
		}
	}

	const changeAvatar = (post: string) => {
		setAvatarUpdate(false)
		let url='http://'+ip+':3001/api/users/change_avatar'
		if (isImage(post) === false) {
			toast.error("Error: Wrong file format.", {
				position: "bottom-right",
				autoClose: 3000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
				progress: undefined,
				theme: "light",
				});
				setAvatar(tmpAvatar)
			return
		}
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"image": post
		}
		)
		.then(() => {
			setAvatar(avatar)
			toast.success("Avatar was changed", {
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

	const change2fa = (e: boolean) => {
		let url='http://'+ip+':3001/api/auth/2fa/change'
		
		axios.post(url,{
			"token": localStorage.getItem("token_transcandence"),
			"is_2fa": e
		}
		)
		.then(response => {
			setTfa(response.data)
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
		if (e.target.files[0].size > 0)
		{
			const file = e.target.files[0];
			let base64: any
			base64 = await convertToBase64(file);
			if (base64.length < MAXLENGTH_PICTURE) {
				setTmpAvatar(avatar)
				setAvatar(base64);
				setAvatarUpdate(true)
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
        		  accept=".png, .jpg"
        		  onChange={(e) => handleFileUpload(e)}
        		/>
				{
					isAvatarUpdate &&
					(
						<button className="btn btn-outline-secondary">Modifier</button>
					)
				}
    		</form>
        </div>
		<div>
			{
				recup_email &&
				(
					<div>
						<h3>Changer l'adresse email</h3>
						<div className="input-group mb-3" style={{width: "300px"}}>
            				<input onChange={(e)=>{if(e.target.value.length < MAXLENGTH_EMAIL){setEmail(e.target.value)}}} value={email} id="input_modify_email" type="text" className="form-control" aria-describedby="button_modify_email"/>
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
			) || recup_email && !ismail &&
			(
				<h4>Pour pouvoir activer la 2fa, entrez une adresse mail ci-dessus</h4>
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
								<li className="list-group-item" key={i}>
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