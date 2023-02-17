import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import swal from 'sweetalert';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import React from 'react'

export interface gameDataDTO {
	p1Y: number
	p2Y: number
	ballX: number
	ballY: number
	ballR: number
	p1Score: any
	p2Score: any
	padHeight: number
	player1Name: string
	player2Name: string
}

export default function Spectate() {

	const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))

	const navigate = useNavigate();
	const dispatch = useDispatch();
	useEffect(() => {
		  dispatch(
			  {
				  type:"ACTUAL_PAGE",
				  actual_page: "spectate"
			  })
	  }, [])


	var canvasRef = useRef<HTMLCanvasElement>(null);
	var canvas: HTMLCanvasElement;
	var game: any;
	var keydown = '';
	let tmp_score1 = 0;
	let tmp_score2 = 0;
	let p1score = 0;
	let p2score = 0;
    let playing = false
	let p1name = ""
	let p2name = ""

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

	const draw = (padWidth: number, padHeight: number, player1Y: number, player2Y: number, gameBallX: number, gameBallY: number, gameBallR: number) => {
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
			context.fillRect(0, player1Y, padWidth, padHeight);
			context.fillRect(canvas.width - padWidth, player2Y, padWidth, padHeight);
			
			// Draw ball
			context.beginPath();
			context.fillStyle = 'white';
			context.arc(gameBallX, gameBallY, gameBallR, 0, Math.PI * 2, false);
			context.fill();
		}
	}

		const play = (data: gameDataDTO) => {
			draw(5, data.padHeight, data.p1Y, data.p2Y, data.ballX, data.ballY, data.ballR);
			(document.querySelector('#player-score') as HTMLInputElement).textContent = data.p1Score;
			(document.querySelector('#player2-score') as HTMLInputElement).textContent = data.p2Score;
			(document.querySelector('#player1-name') as HTMLInputElement).textContent = data.player1Name;
			(document.querySelector('#player2-name') as HTMLInputElement).textContent = data.player2Name;
			p1score = data.p1Score;
			p2score = data.p2Score;
			p1name = data.player1Name
			p2name = data.player2Name
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

	const endGame = (data: string) => {
		if (data === "player1") {
		let txt = p1name + " a gagne"
			swal({
				title: "FIN DU MATCH",
				text: txt,
				icon: "success",
				timer: 6000,
		 }).then(() => {
				navigate("/home")
				window.location.reload();
			})
			.catch((error) => {
			});
		}
		if (data === "player2") {
			let txt = p2name + " a gagne"
			swal({
				title: "FIN DU MATCH",
				text: txt,
				icon: "success",
				timer: 6000,
		 }).then(() => {
				navigate("/home")
				window.location.reload();
			})
			.catch((error) => {
			});
		}
	}

	if (canvasRef.current)
			canvas = canvasRef.current;

	useEffect(() => {
		socket?.on("winTransfer", endGame)
		return () => {
			socket?.off("winTransfer", endGame)
		}
	}, [endGame])

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

	useEffect(() => {
		if (canvasRef.current)
			canvas = canvasRef.current;
	}, [])

    return (
	<>
		<div style={{textAlign: "center", marginTop: "10%"}}>
            <div style={{textAlign: "center"}}>
			    <h2>
					<span id="player1-name">Joueur 1</span> {' '}
					[ {' '}<span id="player-score">0</span> | <span id="player2-score">0</span>{' '}]{' '}<span id="player2-name">Joueur 2</span>
				</h2>
            </div>
    		<canvas id="canvas" width={900} height={450} style={{width: "50%", height: "50%"}} ref={canvasRef}></canvas>
		</div>
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