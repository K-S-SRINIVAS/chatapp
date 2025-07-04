import { useState, useEffect, useContext } from 'react'
import assets from '../assets/assets'
import { ChatContext } from '../../context/chatContext'
import { AuthContext } from '../../context/AuthContext';

const RightSideBar = () => {

  const {selectedUser,messages,removeFriend,slideOpen,handleSliding}=useContext(ChatContext);
  const {onlineUser} =useContext(AuthContext);
  const [msgImages,setMsgImages]=useState([]);
  const [isActive, setIsActive] = useState(false);

  const handleRemoveFriend=async (e,friendId)=>{
    e.preventDefault();
    await removeFriend(friendId);
  }

  const handleToggle = () => {
    setIsActive(!isActive);
  };

  // get all messages{image} & set them to state 
  useEffect(()=>{
    setMsgImages(
      messages.filter(msg=>msg.image).map(msg=>msg.image)
    )
  },[messages])
  
  return selectedUser && (
    <div className={`bg-gradient-to-t from-green-300 via-blue-400 to-blue-500 w-full  text-white overflow-y-scroll relative ${!slideOpen?'max-md:hidden':''}`}>
      <div onClick={handleSliding} className='flex justify-center items-center p-2 bg-gray-400 rounded-2xl absolute left-0 top-[50%] md:hidden'>
        <img src={assets.rightArrow_icon} alt="slideIcon" className='max-w-3' />
      </div>
      <div className='flex justify-end items-center p-2 '>
        <div className='flex justify-center items-center group'>
          <img onClick={handleToggle} src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer group' />
          <div className={`absolute top-2 right-6 z-20 p-2 rounded-md text-white bg-gray-600/30 group-hover:block ${isActive ? "block" : "hidden"}`}>
            <p onClick={(e)=>handleRemoveFriend(e,selectedUser._id)} className='cursor-pointer text-xs'>Remove friend</p>
          </div>  
        </div>
      </div>
      <div className='pt-12 flex flex-col items-center text-xs font-light mx-auto gap-2'>
        <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-20 aspect-[1/1] rounded-full'/>
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2 text-white'>
          {onlineUser.includes(selectedUser._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p> } 
          {selectedUser.fullName}
        </h1>
        <p className='px-10 mx-auto text-white'>{selectedUser.bio}</p>
      </div>

      <hr className='border-[#ffffff50] my-4'/>

      <div className='px-5 text-xs'>
        <p>Media files</p>
        <div className='mt-2 max-h-[200px] overflow-y-scroll grid grid-cols-2
        gap-4 opacity-80'>
          {msgImages.map((url,index)=>(
            <div key={index} onClick={()=>window.open(url)} className='cursor-pointer rounded'>
              <img src={url} alt="" className='h-full rounded-md' />
            </div>
          ))}
        </div> 
      </div>

    </div>
  )
}

export default RightSideBar
