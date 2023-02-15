import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import io from "socket.io-client"

import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";

export const get_my_token_from_document = ( my_token:string ) =>{
    let tokens=document.cookie.split(';')
    let token_res = ''
    tokens.map(token => {
        if (token.substring(0, my_token.length+2).trim() === my_token+'=')
            token_res = token.substring(my_token.length+2).trim()
    })
    return token_res
}
export function RequireNoAuthentification (exact_path: string, Component_success: any, route_error: string) {
    const dispatch = useDispatch();
    const {token} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    const {ip} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))

    const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
      }))
    if (!token && localStorage.getItem("token_transcandence"))
        dispatch(
            {
                type:"TOKEN",
                token: localStorage.getItem("token_transcandence")
            }
        )
    else if (!token)
        return <Route path={exact_path} element={Component_success} />
    if (!socket)
        dispatch(
            {
            type:"SOCKET",
            socket:io(ip+':3001', {
                transports: ['websocket'], 
                upgrade: false,
                query: {
                    jwt: localStorage.getItem("token_transcandence")
                }
            })
            }
        )
    return <Route path={exact_path} element={<Navigate to={route_error} replace={true} />}/>
}
export function RequireAuthentification (exact_path: string, Component_success: any, route_error: string) {
    const dispatch = useDispatch();
    const {token} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    const {ip} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    
    const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    if (!token && localStorage.getItem("token_transcandence"))
    {
        dispatch(
            {
                type:"TOKEN",
                token: localStorage.getItem("token_transcandence")
            }
        )
    }
    else if (!token)
            return <Route path={exact_path} element={<Navigate to={route_error} replace={true} />}/>
    if (!socket)
        dispatch(
            {
                type:"SOCKET",
            	socket:io(ip+':3001', {
                transports: ['websocket'], 
                upgrade: false,
                query: {
                    jwt: localStorage.getItem("token_transcandence")
                }
            })
        }
        )
    return <Route path={exact_path} element={Component_success} />
}
export function RequireAuthentificationContainer () {
    const dispatch = useDispatch();
    const {token} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    const {ip} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))
    
    const {socket} = useSelector((state: any) => ({
        ...state.ConfigReducer
    }))

    if (!token && localStorage.getItem("token_transcandence"))
    {
        dispatch(
            {
                type:"TOKEN",
                token: localStorage.getItem("token_transcandence")
            }
        )
    }
    else if (!token)
            return false
    if (!socket)
        dispatch(
            {
                type:"SOCKET",
            	socket:io(ip+':3001', {
                transports: ['websocket'], 
                upgrade: false,
                query: {
                    jwt: localStorage.getItem("token_transcandence")
                }
            })
        }
        )
    return true
}