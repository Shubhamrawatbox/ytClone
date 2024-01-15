import mongoose from "mongoose";

const likesSchema=new mongoose.Schema({
    comment:{
        type:mongoose.Schema.ObjectId,
        ref:"Comment"
    },
    video:{
        type:mongoose.Schema.ObjectId,
        ref:"Video"
    },
    likedBy:{
        type:mongoose.Schema.ObjectId,
        ref:"User"
    },
    tweet:{
        type:mongoose.Schema.ObjectId,
        ref:"Tweet"
    }
},{timestamps:true});

export const Like=new mongoose.model("Like",likesSchema)