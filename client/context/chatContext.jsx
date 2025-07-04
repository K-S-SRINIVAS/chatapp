import { createContext, useContext, useState, useEffect } from "react";
import { AuthContext } from "./AuthContext";
import toast from "react-hot-toast";


export const ChatContext=createContext();

export const ChatProvider = ({children}) =>{

    const [messages,setMessages]=useState([]);
    const [friendsList,setFriendsList]=useState([]);
    const [selectedUser,setSelectedUser]=useState(null);
    const [unseenMessages,setUnseenMessages]=useState({});
    const [invitations,setInvitations]=useState([]);
    const [slideOpen, setSlideOpen] = useState(false);

    const {socket,axios}=useContext(AuthContext);
    
    const handleSliding=()=> {setSlideOpen(!slideOpen);}

    // func to get all users for left sidebar
    const getFriendsList=async ()=>{
        try {
           const {data} = await axios.get('/api/messages/friendsList');
           if(data.success) {
            setFriendsList(data.friendsList);
            setUnseenMessages(data.unseenMessages);
           }    
        } 
        catch (error) {
            toast.error(error.message)
        }
    }

    // func to get messages for selected user
    const getMessages =async (userId) =>{
        try {
           const {data}=await axios.get(`/api/messages/${userId}`);    
           if(data.success) {
            setMessages(data.messages);
           }
        } 
        catch (error) {
            toast.error(error.message);
        }
    }

    // func to send message to selected user
    const sendMessage =async (messageData)=>{
        try {
          const {data}=await axios.post(`/api/messages/send/${selectedUser._id}`,messageData);
          if(data.success) {
            setMessages( (prevMessages)=>[...prevMessages,data.newMessage] )
          }
          else {
            toast.error(data.message);
          }   
        } 
        catch (error) {
            toast.error(error.message);
        }
    }

    //func to send invite to a friend
    const sendInvite=async(receiverInfo)=>{
        try {
            const {data}=await axios.post('/api/messages/invite',receiverInfo)
            const {success,message}=data
            
            if(success) toast.success(message);
            else toast.error(message);
        } 
        catch (error) {
            toast.error(error.message);
        }
        
    }

    //func to send invite to a friend
    const acceptInvite=async(senderEmail)=>{
        const {data}=await axios.post('/api/messages/acceptInvite',senderEmail);
        if(data.success) {
           toast.success(data.message);
           setInvitations(invitations.filter( (user)=>(user.email!==senderEmail.senderEmail) ) );
           getFriendsList();
        }    
        else toast.error(data.message);
    }

    //func to reject invite of a friend
    const rejectInvite=async(senderEmail)=>{
        const {data}=await axios.put('/api/messages/rejectInvite',senderEmail);
        try {    
            if(data.success) {
              await getInvitations();
              toast.success(data.message)
            }    
            else toast.error(data.message);
        }
        catch (error) {
            toast.error(error.message)
        }
    }

    // func to get all invitations
    const getInvitations=async()=>{
        try {
           const {data} = await axios.get('/api/messages/getInvitations');
           if(data.success) {
             setInvitations(data.invitations);
           }    
        } 
        catch (error) {
            toast.error(error.message)
        }
    }
    
    const removeFriend=async (friendId)=>{
        try {
            const {data} = await axios.put(`/api/messages/removeFriend/${friendId}`);
            if(data.success) {
             getFriendsList();
             if(selectedUser?._id===friendId) setSelectedUser(null);
             toast.success(data.message)
            }
            else toast.error(data.message)
        } 
        catch (error) {
            toast.error(error.message)
        }
    }

    // func to subscribe to messages for selected user
    const subscribeToMessages =async () =>{
        if(!socket) return;
        
        socket.on('invite', (invitation)=>{
            setInvitations((prevInvitations)=>[...prevInvitations,invitation])
        })

        socket.on('inviteAccepted',async (acknowledgment)=>{
            const {message}=acknowledgment;
            toast.success(message);
            getFriendsList();
        })

        socket.on('removedFriend',async (info)=>{
            const {id}=info;
            getFriendsList();
            if(selectedUser?._id===id) setSelectedUser(null);
        })

        socket.on("newMessage",(newMessage)=>{
            if(selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen=true;
                setMessages((prevMessages)=>[...prevMessages,newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }
            else {
                setUnseenMessages((prevUnseenMessages)=>({
                    ...prevUnseenMessages,
                    [newMessage.senderId] : prevUnseenMessages[newMessage.senderId] ? prevUnseenMessages[newMessage.senderId]+1:1
                }))
            }
        })

    }
    
    // func to unsubscribe from messages
    const unsubscribeFromMessages =()=>{
        if(socket) {
            socket.off("invite")
            socket.off("newMessage");
            socket.off("removedFriend");
            socket.off("inviteAccepted");
        }    
    }

    useEffect(()=>{ 
       subscribeToMessages();
       return ()=>unsubscribeFromMessages()//exec when compo unmount or just before re-render
    } , [socket,selectedUser] )

    const value={
       messages,
       friendsList,
       selectedUser,
       getFriendsList,
       getMessages,
       sendMessage,
       setSelectedUser,
       unseenMessages,
       setUnseenMessages,
       invitations,
       sendInvite,
       acceptInvite,
       rejectInvite,
       getInvitations,
       removeFriend,
       handleSliding,
       slideOpen
    }

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    )
}