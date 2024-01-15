import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const commentSchemea=new mongoose.Schema({
    content:{
        type:String,
        required:true
    },
    video:{
        type:mongoose.Schema.ObjectId,
        ref:"Video"
    },
    owner:{
        type:mongoose.Schema.ObjectId,
        ref:"User"
    }
},{timestamps:true})

commentSchemea.plugin(mongooseAggregatePaginate)
export const Comment=new mongoose.model("Comment",commentSchemea)