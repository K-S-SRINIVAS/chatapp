import React, { useContext, useEffect, useState, useRef } from 'react'
import assets from '../assets/assets.js'
import { formatMessageTime } from '../lib/utils'
import { ChatContext } from '../../context/chatContext'
import { AuthContext } from '../../context/AuthContext'

const ChatContainer = () => {
  
  const {messages,sendMessage,getMessages,selectedUser,setSelectedUser,sendInvite,acceptInvite,invitations,getInvitations,rejectInvite,slideOpen,handleSliding}=useContext(ChatContext);
  const {authUser,onlineUser}=useContext(AuthContext);
  
  const scrollEnd=useRef()
  
  const [input,setInput]=useState("");

  const [inviteEmail,setInviteEmail]=useState("");
  const [inviteMessage,setInviteMessage]=useState("");
  
  // handle sending a message
  const handleSendMessage=async(e) =>{
     e.preventDefault();
     if(input.trim()==="") return null;
     await sendMessage( {text:input.trim()} );
     setInput("");
  }

  // handle sending an image
  const handleSendImage= async (e)=>{
     const file=e.target.files[0];
     if(!file || !file.type.startsWith("image/")) {
      toast.error("select an image file");
      return;
     }
     const reader=new FileReader();
     reader.onloadend=async()=>{
      await sendMessage({image:reader.result})
      e.target.value=""; 
    }
     reader.readAsDataURL(file);
     
  }

  const handleSendInvite=async (e)=>{
    e.preventDefault();
    await sendInvite( {email:inviteEmail,message:inviteMessage} );
    setInviteEmail("");
    setInviteMessage("");
  }

  const handleAcceptInvite=async (e,senderEmail)=>{
    e.preventDefault();
    await acceptInvite( {senderEmail} );
  }

  const handleRejectInvite=async (e,senderEmail)=>{
    e.preventDefault();
    await rejectInvite( {senderEmail} );
  }

  useEffect(()=>{
    if(selectedUser) {
      getMessages(selectedUser._id);
    }
    getInvitations();
  },[selectedUser])

  useEffect(()=>{
     if(scrollEnd.current && messages) scrollEnd.current.scrollIntoView({behavior:"smooth"})
  },[messages])


  
  return selectedUser ? (
    <div className={`bg-gradient-to-r from-blue-500 via-blue-400 to-blue-500 h-full overflow-scroll relative backdrop-blur-lg ${slideOpen?'max-md:hidden':''}`}>

      {/* header */}
      <div className='flex items-center gap-3 py-3 mx-4 border-b border-stone-500'>
        <img src={selectedUser.profilePic || assets.avatar_icon} alt="" className='w-8 rounded-full aspect-square ' />

        <p onClick={handleSliding} className='flex-1 text-lg text-white flex items-center gap-2 '>
          {selectedUser.fullName}
          { onlineUser.includes(selectedUser._id) && <span className='w-2 h-2 rounded-full bg-green-500'></span> }
        </p>

        <img onClick={()=>setSelectedUser(null)} src={assets.arrow_icon} alt="backIcon"  className='cursor-pointer max-w-3'/>
      </div>

      {/* chat room */}
      <div className='flex flex-col overflow-y-scroll p-3 pb-6 h-[calc(100%-120px)]'>
           {messages.map((msg,index)=>(
              <div key={index} className={`flex items-end gap-2 justify-end ${msg.senderId !== authUser._id && 'flex-row-reverse'} `} >
                {msg.image ? 
                  ( <img src={msg.image} alt="" className='max-w-[230px] border border-gray-700 rounded-lg overflow-hidden mb-8' />  ) :
                  ( <p className={`p-2 max-w-[200px] md:text-sm font-light rounded-lg mb-8 break-words bg-violet-500/30 text-white 
                    ${msg.senderId !== authUser._id} ? 'rounded-bl-none' : 'rounded-br-none'}`}>{msg.text}</p> )
                }

                <div className='text-center text-xs'>
                  <img src={msg.senderId === authUser._id ? authUser.profilePic || assets.avatar_icon : selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-7 rounded-full aspect-square' />
                  <p className='text-gray-500'>{ formatMessageTime( msg.createdAt ) } </p>
                </div>   
              </div>
           ))}

           <div ref={scrollEnd}></div>
      </div>

      {/* bottom area */}
      <div className='absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3'>
        <div className='flex-1 flex items-center bg-gray-100/12 px-3 rounded-full'>
          <input type="text" onChange={(e)=>setInput(e.target.value)} value={input} placeholder='Type message here..' className='flex-1 text-sm p-3 border-none rounded-lg outline-none text-white placeholder-white'/>
          <input onChange={handleSendImage} type="file" id='image' accept='image/png,image/jpeg,image/jpg' hidden/>
          <label htmlFor="image">
            <img src={assets.gallery_icon} alt="" className='w-5 mr-2 cursor-pointer' />
          </label>
        </div>
        <img onClick={handleSendMessage} src={assets.send_button} alt="sendIcon" className='w-7 cursor-pointer' />
      </div>
  </div>    
  ) : (
    <div className={`relative bg-gradient-to-t from-green-300 via-blue-400 to-blue-500 flex items-center flex-col justify-start gap-5 text-gray-500  ${!slideOpen?'max-md:hidden':''}`}>
      <div onClick={handleSliding} className='flex justify-center items-center p-2 bg-gray-400 rounded-2xl absolute left-0 top-[50%] md:hidden'>
        <img src={assets.rightArrow_icon} alt="slideIcon" className='max-w-3' />
      </div>
      <form onSubmit={handleSendInvite} className='flex items-center justify-center w-full gap-3 mt-6 p-2'>
        <div className='flex flex-col gap-2'>
          <input type="email" onChange={(e)=>setInviteEmail(e.target.value)} value={inviteEmail} className=' p-1 border-none bg-gray-400 rounded-full outline-none text-sm text-white placeholder-white max-lg:text-xs' placeholder="Type your friend's email" required />
          <input type="text" maxLength='20' onChange={(e)=>setInviteMessage(e.target.value)} value={inviteMessage} className='w-60 p-1 border-none bg-gray-400 rounded-full outline-none text-sm text-white placeholder-white max-lg:text-xs ' placeholder="Type short message for your friend" required />
        </div>
        <button type="submit" className='p-1 text-white text-sm rounded-full bg-green-300 cursor-pointer'>Send Invite</button>
      </form>
    
      {invitations.length===0 ? (
        <div className='flex flex-col items-center justify-center gap-2'>
          <img src={assets.logo} alt="Logo Icon" className='max-w-35 mt-4 ' />
          <p className='text-lg text-white font-medium text-center'>Chat anytime ,anywhere!All you need is the Internet</p>
        </div>
      ):(
        <div className='flex flex-col items-center border-2 border-gray-400 rounded-lg h-full mb-5 z-10 overflow-y-scroll'>
          <h2 className='mb-2 text-xl text-800 text-white'>Invitations</h2>
          {invitations.map((user,index)=>(
            <div key={index} className={`relative flex items-center  gap-3 p-2 rounded max-sm:text-sm h-10 `} >
              <img src={user?.profilePic || assets.avatar_icon} alt="UserPic" className='w-[35px] aspect-[1/1] rounded-full transition-transform duration-300 hover:scale-300 hover:translate-x-6 hover:translate-y-6 z-20'/>
              <div className='flex flex-col leading-5'>
                <p className='text-gray-700'>{user.fullName}</p>
                {
                  onlineUser.includes(user.id)?
                  <span className='text-green-400 text-xs'>Online</span> : 
                  <span className='text-white text-xs'>Offline</span>
                }  
              </div>
              <p className='text-[9px] w-22 truncate hover:whitespace-normal hover:overflow-visible hover:text-xs hover:rounded-none p-1 pl-3 border-black border rounded-r-full rounded-tl-full bg-white'>{user.message}</p>
              <div className='flex gap-2 ml-4'>
                <button type="button" onClick={(e)=>handleAcceptInvite(e,user.email)} className='p-1 bg-green-200 text-sm cursor-pointer'>Accept</button>
                <button type="button" onClick={(e)=>handleRejectInvite(e,user.email)} className='p-1 bg-red-200 text-sm cursor-pointer'>Delete</button>
              </div>
            </div>
          ))} 
        </div>
      )}
      
    </div>
  )
}

export default ChatContainer
