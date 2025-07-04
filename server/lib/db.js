import mongoose from "mongoose";

// func to connect to mongodb database
export const connectDB=async () =>{
    try {
        mongoose.connection.on( "connected",()=>console.log("connected to database") )
        mongoose.connection.on( "disconnected",()=>console.log("disconnected from database") )
        await mongoose.connect(`${process.env.MONGODB_URI}/chatapp`)

    }
    catch(err) {
       console.error("Error occured in db conn => ",err);
    }
}
