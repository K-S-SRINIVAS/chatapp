import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets.js' 
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext.jsx'
import { ChatContext } from '../../context/chatContext.jsx'
const Sidebar = () => {
  
  const {getFriendsList,friendsList,selectedUser,setSelectedUser,unseenMessages,setUnseenMessages,slideOpen,handleSliding}=useContext(ChatContext);

  const {logout,onlineUser}=useContext(AuthContext);

  const [input,setInput]=useState(false);
  
  const [isActive, setIsActive] = useState(false);
  
  const filteredList=input ? friendsList.filter( (user)=>(user.fullName.toLowerCase()).includes( input.toLowerCase() ) ) : friendsList
  
  const handleToggle = () => {
    setIsActive(!isActive);
  };

  useEffect( ()=>{
    getFriendsList();
  },[onlineUser] )
  
  const navigate=useNavigate();
  
  
  return (
    <div className={`bg-gradient-to-t from-green-300 via-blue-400 to-blue-500  h-full relative p-5 rounded-l-xl overflow-y-scroll text-white 
                  ${selectedUser || slideOpen ? 'max-md:hidden' : ''} ` }>
      <div onClick={handleSliding} className='flex justify-center items-center bg-gray-400 rounded-2xl p-2 absolute right-0 top-[50%] md:hidden'>
        <img src={assets.arrow_icon} alt="slideIcon" className='max-w-3' />
      </div>              
      <div className='pb-5'>
        <div className='flex justify-between items-center'>
            <img src={assets.logo} alt="logo" className='max-w-8'/>
            <div className='relative py-2 group'>
              <img onClick={handleToggle} src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer' />
              <div className={`absolute top-7 right-0 z-20 w-32 p-5 rounded-md bg-[#282142] border border-gray-600 text-gray-100  group-hover:block ${isActive ? "block" : "hidden"}`}>
                  <p onClick={()=>{navigate('/profile')}} className='cursor-pointer text-sm'>Edit Profile</p>
                  <hr className='my-2 border-t border-gray-500'/>
                  <p onClick={logout} className='cursor-pointer text-sm'>Logout</p>
              </div>
            </div>
        </div>
        
        <div className='bg-[#282142] rounded-full flex items-center gap-2 py-3 px-4 mt-5'>
          <img src={assets.search_icon} alt="Search" className=' w-3' />
          <input onChange={(e)=>setInput(e.target.value)} type="text" className='bg-transparent px-1 py-1 border-none outline-none text-white placeholder-[#c8c8c8] ' placeholder="Search User..." /> 
        </div>

      </div>

      <div className=' flex flex-col'>
        {filteredList.map((user,index)=>(
          <div onClick={ ()=>{setSelectedUser(user);setUnseenMessages(prev=>({...prev,[user._id]:0}))} }
           key={index} className={`relative flex items-center gap-2 p-2 pl-4 border rounded cursor-pointer max-sm:text-sm ${selectedUser?._id===user._id && 'bg-[#282142]/50' } `} >
            <img src={user?.profilePic || assets.avatar_icon} alt="UserPic" 
            className='w-[35px] aspect-[1/1] rounded-full '/>
            <div className='flex flex-col leading-5'>
              <p>{user.fullName}</p>
              {
                onlineUser.includes(user._id)?
                <span className='text-green-400 text-xs'>Online</span> : 
                <span className='text-neutral-400 text-xs'>Offline</span>
              } 
            </div> 
            { unseenMessages[user._id]>0 && <p className='absolute top-4 right-4 text-xs h-5 w-5 flex justify-center items-center rounded-full bg-violet-500/50'>{unseenMessages[user._id]}</p>} 
          </div>
        ))} 
      </div>
    </div>
  )
}

export default Sidebar