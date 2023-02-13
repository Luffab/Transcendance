import { useEffect, useRef, useState } from "react";
import React from 'react'
import { useSelector, useDispatch } from "react-redux";
import swal from 'sweetalert';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

export interface gameDataDTO {
	pY: number
	ballX: number
	ballY: number
	ballR: number
	p1Score: any
	p2Score: any
	player1Name: string
	player2Name: string
}

export interface winDataDTO {
	winner: string
	p1score: number
	p2score: number
	player1: string
	player2: string
}

export default function Pong() {

	const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))
	  const dispatch = useDispatch();
	  useEffect(() => {
			dispatch(
				{
					type:"ACTUAL_PAGE",
					actual_page: "pong"
				})
		}, [])
	var [is_playing, setIsPlaying] = useState(false)


	var canvasRef = useRef<HTMLCanvasElement>(null);
	var canvas: HTMLCanvasElement;
	var game: any;
	var keydown = '';
	let tmp_score1 = 0;
	let tmp_score2 = 0;
	let p1score: number
	let p2score: number

	game = {
		player: {
			score: 0
		},
		computer: {
			score: 0,
			speedRatio: 0
		},
		ball: {
			r: 2,
			speed: {}
		},
		side: {
			value: "unknown"
		}
	};

	document.body.addEventListener('keydown', e => {
		keydown = e.key;
	  });
	  document.body.addEventListener('keyup', e => {
		keydown = '';
	  });
	

	  
	const PLAYER_HEIGHT = 80;
	const PLAYER_WIDTH = 5;

	const update = () => {
		switch (keydown) {
		case 'ArrowUp':
			if (game.player.y - 15 >= 4) {
				let jsonUp = {
					jwt: localStorage.getItem("token_transcandence"),
					socketId: socket.id,
					movement: "ArrowUp"
				}
				socket?.emit("movePlayer", jsonUp)
				game.player.y -=4;
			}
		  break;
		case 'ArrowDown':
			if (game.player.y + 99 <= canvas.height) {
				let jsonDown = {
					jwt: localStorage.getItem("token_transcandence"),
					socketId: socket.id,
					movement: "ArrowDown"
				}
				socket?.emit("movePlayer", jsonDown)
				game.player.y += 4;
			}		
		  break;
		default:
			keydown = ''
		}
	}

	const draw = (player2Y: number, gameBallX: number, gameBallY: number, gameBallR: number) => {
		var context = canvasRef.current?.getContext('2d')
		if (context) {

		// Draw field
			context.fillStyle = 'black';
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			// Draw middle line
			context.strokeStyle = 'white';
			context.beginPath();
			context.moveTo(canvas.width / 2, 0);
			context.lineTo(canvas.width / 2, canvas.height);
			context.stroke();
			
			// Draw players
			context.fillStyle = 'white';
			if (game.side.value === "left") {
				context.fillRect(0, game.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
				context.fillRect(canvas.width - PLAYER_WIDTH, player2Y, PLAYER_WIDTH, PLAYER_HEIGHT);
			}
			else if (game.side.value === "right") {
				context.fillRect(0, player2Y, PLAYER_WIDTH, PLAYER_HEIGHT);
				context.fillRect(canvas.width - PLAYER_WIDTH, game.player.y, PLAYER_WIDTH, PLAYER_HEIGHT);
			}
		
			// Draw ball
			context.beginPath();
			context.fillStyle = 'white';
			context.arc(gameBallX, gameBallY, gameBallR, 0, Math.PI * 2, false);
			context.fill();
	}
	}

		const reset_player = (event: string) => {
			game.player.y = canvas.height / 2 - PLAYER_HEIGHT / 2;
			if (event === "p1")
				tmp_score1++;
			else if (event === "p2")
				tmp_score2++;
		}

		const checkScore = (p1score: number, p2score: number) => {
			if (p1score == 1) {
				
				if (tmp_score1 == 0)
					reset_player("p1");
			}
			else if (p1score == 2) {
				if (tmp_score1 == 1)
					reset_player("p1");
			}
			else if (p1score == 3) {
				if (tmp_score1 == 2)
					reset_player("p1");
			}
			if (p2score == 1) {
				if (tmp_score2 == 0)
					reset_player("p2");
			}
			else if (p2score == 2) {
				if (tmp_score2 == 1)
					reset_player("p2");
			}
			else if (p2score == 3) {
				if (tmp_score2 == 2)
					reset_player("p2");
			}
		}

		const play = (data: gameDataDTO) => {
			draw(data.pY, data.ballX, data.ballY, data.ballR);
			(document.querySelector('#player-score') as HTMLInputElement).textContent = data.p1Score;
			(document.querySelector('#player2-score') as HTMLInputElement).textContent = data.p2Score;
			(document.querySelector('#player1-name') as HTMLInputElement).textContent = data.player1Name;
			(document.querySelector('#player2-name') as HTMLInputElement).textContent = data.player2Name;
			p1score = data.p1Score;
			p2score = data.p2Score;
			update()
			checkScore(data.p1Score, data.p2Score)
		}
	
	window.onpopstate=function()
	{
		let json = {
			jwt: localStorage.getItem("token_transcandence"),
			socketId: socket.id
		}
		socket?.emit("userLeft", json)
	}


	useEffect(() => {
		socket?.on("dataTransfer", play)
		return () => {
			socket?.off("dataTransfer", play)
		}
	}, [play])

	const endGame = (data: winDataDTO) => {
		p1score = data.p1score
		p2score = data.p2score
		if (data.winner === "player1") {
			if (game.side.value === "left")
				swal({
					title: "VICTOIRE",
					text: "Vous avez gagne",
					icon: "success",
					timer: 6000,
			  	}).then(data => {
					window.location.reload();
				})
				.catch((error) => {
				});
			else if (game.side.value === "right")
				swal({
					title: "DEFAITE",
					text: "Vous avez perdu",
					icon: "error",
					timer: 6000,
			 }).then(data => {
				window.location.reload();
			})
			.catch((error) => {
			});
		}
		if (data.winner === "player2") {
			if (game.side.value === "right")
				swal({
					title: "VICTOIRE",
					text: "Vous avez gagne",
					icon: "success",
					timer: 6000,
			  }).then(data => {
				window.location.reload();
				})
				.catch((error) => {
			});
			else if (game.side.value === "left")
				swal({
					title: "DEFAITE",
					text: "Vous avez perdu",
					icon: "error",
					timer: 6000,
			 	}).then(data => {
					window.location.reload();
				})
				.catch((error) => {
				});
		}
	}

	useEffect(() => {
		socket?.on("winTransfer", endGame)
		return () => {
			socket?.off("winTransfer", endGame)
		}
	}, [endGame])

	const killedGame = () => {
		swal({
			title: "VICTOIRE",
			text: "Vous avez gagne",
			icon: "success",
			timer: 6000,
	  }).then(data => {
		window.location.reload();
		})
		.catch((error) => {
		});
	}

	useEffect(() => {
		socket?.on("killedGame", killedGame)
		return () => {
			socket?.off("killedGame", killedGame)
		}
	}, [killedGame])

	const reset = () => {
		game.ball.x = canvas.width / 2;
		game.ball.y = canvas.height / 2;
		game.player.y = canvas.height / 2 - PLAYER_HEIGHT / 2;
	
		// Reset speed
		game.ball.speed.x = -2;
		game.ball.speed.y = 0;
	}

	const whichSide = (side: string) => {
		if (side === "left")
			game.side.value = "left"
		else if (side === "right")
			game.side.value = "right"
	}

	function canplay () {
		if (canvasRef.current)
			canvas = canvasRef.current;
		reset()

		// Mouse click event
		if (is_playing === false) {
			let details = {
				jwt: localStorage.getItem("token_transcandence"),
				socketId: socket.id
			}
			socket?.emit("tryToPlay", details)
			socket?.on("rightOrLeft", whichSide)
		}
		else
			alert('Cant play')
	}

	const errorPrivate = (newMessage: string) => {
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
		socket?.on("receiveErrorPublic", errorPrivate)
		return () => {
			socket?.off("receiveErrorPublic", errorPrivate)
		}
	}, [errorPrivate])


    return (
	<>
	{
		<div style={{textAlign: "center", marginTop: "10%"}}>
				<h2>
					<span id="player1-name">Joueur 1</span> {' '}
					[ {' '}<span id="player-score">0</span> | <span id="player2-score">0</span>{' '}]{' '}<span id="player2-name">Joueur 2</span>
				</h2>
   				<ul style={{listStyle: "none"}}>
					<li>
            			<button id="start-game" className="btn btn-primary" onClick={canplay}>Demarrer</button>
        			</li>
    			</ul>
    		<canvas id="canvas" width={900} height={450} style={{width: "50%", height: "50%"}} ref={canvasRef}></canvas>
		</div>
	}
	</>
	);
}