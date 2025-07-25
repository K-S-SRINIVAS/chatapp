import { createContext } from "react";
import axios from 'axios'
import { useState } from "react";
import toast from "react-hot-toast";
import { useEffect } from "react";
import {io} from 'socket.io-client'


const backendUrl=import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL=backendUrl;

export const AuthContext = createContext();

export const AuthProvider = ( {children} )=>{
    const [token,setToken]=useState(null);
    const [authUser,setAuthUser]=useState(null);
    const [onlineUser,setOnlineUser]=useState([]);    
    const [socket,setSocket]=useState(null);

    //if user authenticated ,set user data & connect the socket
    const checkAuth=async() =>{
        try {
          const {data}=await axios.get("/api/auth/check");
          if(data.success) {
            setAuthUser(data.user);   
            connectSocket(data.user)
          }
        } 
        catch (error) {
            toast.error(error.message)
        }
    }

    // login func to handle user authentication & socket connection

    const login=async(state,credential)=>{
        try {
           const {data}=await axios.post(`/api/auth/${state}`,credential);
           if(data.success) {
            setAuthUser(data.userData);
            connectSocket(data.userData);
            axios.defaults.headers.common["token"]=data.token;
            setToken(data.token);
            localStorage.setItem("token",data.token);
            toast.success(data.message);
           }
           else {
            toast.error(data.message);
           }
        } 
        catch (error) {
            toast.error(error.message)
        }
    }

    // logout func to handle user logout & socket disconnection
    const logout =async()=>{
        localStorage.removeItem("token");
        setToken(null);
        setAuthUser(null);
        setOnlineUser([]);
        axios.defaults.headers.common["token"]=null;
        toast.success("Logged out successfully");
        socket.disconnect();
    }

    // update-profile func to handle user profile updates
    const updateProfile=async(body)=>{
        try {
            const {data}=await axios.put('api/auth/update-profile',body);
            if(data.success) {
                setAuthUser(data.user);
                toast.success("Profile updated successfully");
            }
            else toast.error(data.message)    
        } 
        catch (error) {
            toast.error(error.message);
        }
    }

    // connect socket func to handle socket connection & online users updates
    const connectSocket=(userData)=>{
        if(!userData || socket?.connected) return;
        const newSocket=io(backendUrl,{
            query:{
                userId:userData._id
            }
        });
        newSocket.connect();
        setSocket(newSocket);

        newSocket.on("getOnlineUsers",(userIds)=>{
            setOnlineUser(userIds);
        })

    }

    useEffect(()=>{
        if(token){
            axios.defaults.headers.common["token"]=token;
            checkAuth();
        }
    },[])

    const value={
          axios,
          authUser,
          onlineUser,
          socket,
          login,
          logout,
          updateProfile
    }

    return (
        <AuthContext.Provider value={value}>
           {children}
        </AuthContext.Provider>    

    )
}