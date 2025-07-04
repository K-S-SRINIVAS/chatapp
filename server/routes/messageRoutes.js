import express from 'express'
import { protectRoute } from '../middlewares/auth.js';
import { getMessages, getFriendsList, markMessageAsSeen, sendMessage,sendInvite, acceptInvite,rejectInvite,getInvitations,removeFriend } from '../controller/messageController.js';

const messageRouter=express.Router();

messageRouter.get('/friendsList',protectRoute,getFriendsList);
messageRouter.put('/mark/:id',protectRoute,markMessageAsSeen);
messageRouter.post('/send/:id',protectRoute,sendMessage);
messageRouter.post('/invite',protectRoute,sendInvite);
messageRouter.post('/acceptInvite',protectRoute,acceptInvite);
messageRouter.put('/rejectInvite',protectRoute,rejectInvite);
messageRouter.get('/getInvitations',protectRoute,getInvitations);
messageRouter.put('/removeFriend/:id',protectRoute,removeFriend);
messageRouter.get('/:id',protectRoute,getMessages);

export default messageRouter;