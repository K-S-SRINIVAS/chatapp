import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from '../lib/cloudinary.js'
import {io,userSocketMap} from '../server.js'

//get all users except logged in users
export const getFriendsList=async (req,res)=>{
    try {
      const userId=req.user._id;
      const friendsList= ( await User.findById( userId ).populate("friends","-password -invitations") ).friends;
      
      //count no. of meesages not seen
      const unseenMessages={};
      const promises=friendsList.map( async (user)=>{
            const messages=await Message.find({senderId:user._id,receiverId:userId,seen:false});
            if(messages.length>0) {
              unseenMessages[user._id]=messages.length;
            }
      })

      await Promise.all(promises);
      res.json({
        success:true,
        friendsList,
        unseenMessages})
      
    } 
    catch (error) {
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
    }
}

//get all messages for selected user
export const getMessages=async(req,res)=>{
    try {
      const {id:selectedUserId}=req.params;
      const myId=req.user._id;
      
      const messages=await Message.find({
        $or:[
          {senderId:myId,receiverId:selectedUserId},
          {senderId:selectedUserId,receiverId:myId}
        ]
      })

      await Message.updateMany(
        {senderId:selectedUserId,receiverId:myId},
        {seen:true}
      )
      res.json({success:true,messages})
      
    } 
    catch (error) {
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
    }
}

//api to mark message as seen using message id
export const markMessageAsSeen = async (req,res)=>{
  try {
    const {id}=req.params;
    await Message.findByIdAndUpdate(id,{seen:true});
    res.json({success:true})
  } 
  catch (error) {
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}

//send message to selected user
export const sendMessage=async (req,res)=>{
  try {
    const {text,image}=req.body;
    const receiverId=req.params.id;
    const senderId=req.user._id;

    let imageUrl;
    if(image) {
       const uploadResponse=await cloudinary.uploader.upload(image);
       imageUrl=uploadResponse.secure_url;
    }

    const newMessage=await Message.create({
      senderId,receiverId,text,image:imageUrl
    })
    
    //emit new message to receiver's socket
    const receiverSocketId=userSocketMap[receiverId];
    if(receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage",newMessage);
    } 

    res.json({success:true,newMessage});
   }
  catch (error) {
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}

// send invite to a friend
export const sendInvite =async (req,res)=> {
    try {
      const {email,message}=req.body;
      const receiver= await User.findOne({email}) ;
      
      if(receiver ) {
        if(req.user.email===email) {
          res.json({success:false,message:"receiver email is same as yours"})
          return;
        }

        if( receiver.invitations.some( invite=>invite.userId.equals(req.user._id) ) ) {
          res.json({success:true,message:"Invitation already sent & no action taken by receiver yet"})
          return;
        }

        if( receiver.friends.includes( req.user._id ) ) {
          res.json({success:true,message:`${receiver.fullName}:${receiver.email}  is already a friend`})
          return;
        }

        const invitations=(await User.findById(req.user._id).select("invitations")).invitations;
        if( invitations.some( invite=>invite.userId.equals(receiver._id) ) ) {
          res.json({success:true,message:`${receiver.fullName}:${receiver.email} already sent a invite`})
          return;
        }

        await User.findByIdAndUpdate(receiver._id,{$push:{ invitations:{userId:req.user._id,message} }})
        const receiverSocketId=userSocketMap[receiver._id];
        if(receiverSocketId) io.to( receiverSocketId ).emit('invite',{
          id:receiver._id,
          email:req.user.email,
          fullName:req.user.fullName,
          profilePic:req.user.profilePic,
          message
        });
        res.json({
          success:true,
          message:"Invitation sent successfully"
        })
      }
      else {
        res.json({
          success:false,
          message:"provided email doesn't exist in our database"
        })
      }
    } 
    catch (error) {
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
    }
}

export const acceptInvite=async (req,res)=>{
    try {
      const user=await User.findById(req.user._id);
      const {senderEmail}=req.body;
      const sender=await User.findOne({email:senderEmail});
      const updatedInvitations=user.invitations.filter( (inviteData)=>!inviteData.userId.equals(sender._id) )
      await User.updateOne( {_id:user._id},{
        $push:{friends:sender._id},
        $set:{invitations:updatedInvitations}
      } );
      await User.findByIdAndUpdate( sender._id,{$push: { friends:user._id }} );
      const senderSocketId=userSocketMap[sender._id];
      if(senderSocketId) io.to( senderSocketId ).emit('inviteAccepted',{
        message:`invite accepted by ${user.fullName}:${user.email} & added to friend list`
      });
      
      res.json({
        success:true,
        message:"successfully added to friend list "
      })
    } 
    catch (error) {
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
    }
}

export const rejectInvite=async(req,res)=>{
  try {
    const user=await User.findById(req.user._id);
    const {senderEmail}=req.body;
    const sender=await User.findOne({email:senderEmail});
    const updatedInvitations=user.invitations.filter( (inviteData)=>!inviteData.userId.equals(sender._id) );
    await User.updateOne( {_id:user._id},{invitations:updatedInvitations} );
      
    res.json({
      success:true,
      message:`request of ${sender.fullName} removed`
    })
  } 
  catch (error) {
    console.log(error.message);
    res.json({
      success:false,
      message:error.message
    })
  }
}

export const removeFriend=async (req,res)=>{
  try {
    const {id}=req.params;
    
    await User.findByIdAndUpdate( req.user._id,{ $pull: { friends:id } } );
    await User.findByIdAndUpdate( id,{ $pull: { friends:req.user._id } } );
    await Message.deleteMany(
        { $or:[
               {senderId:req.user._id,receiverId:id},
               {senderId:id,receiverId:req.user._id}
              ]
        } 
    )
    const friendSocketId=userSocketMap[id];
    if(friendSocketId) io.to(friendSocketId).emit( 'removedFriend' , {id:req.user._id} )
    res.json({
      success:true,
      message:`removed from friendList `
    })  
  } 
  catch (error) {
    console.log(error.message);
    res.json({
       success:false,
       messsage:error.message
      }
    )
  }
}

//get all invitations
export const getInvitations=async (req,res)=>{
    try {
      const userId=req.user._id;
      const inviters=( await User.findById( userId ).select("invitations") )?.invitations ;
      
      const invitations=[]
      const promises=inviters.map( async (inviterData)=>{
            const inviter=await User.findById(inviterData.userId);
            invitations.push({
              id:inviter._id,
              fullName:inviter.fullName,
              profilePic:inviter.profilePic,
              email:inviter.email,
              message:inviterData.message
            });
      })

      await Promise.all(promises);
      res.json({
        success:true,
        invitations
      })
      
    } 
    catch (error) {
      console.log(error.message);
      res.json({
        success:false,
        message:error.message
      })
    }
}