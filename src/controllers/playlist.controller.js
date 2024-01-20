import mongoose from "mongoose";
import { PlayList } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if ([name, description].some((item) => item === "")) {
    throw new ApiErrorHandle(400, "All Field Required");
  }
  const ownerId = req.user?._id;
  const createPlaylist = await PlayList.create({
    name,
    description,
    owner: ownerId,
  });

  if (!createPlaylist) {
    throw new ApiErrorHandle(500, "Internal Server Error");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, "Create Playlist Successfully", createPlaylist));
});

//get User Playlist
const getUserPlayLists = asyncHandler(async (req, res) => {
  const pipeline=[]
  pipeline.push({$match:{owner:new mongoose.Types.ObjectId(req.user?._id)}})
  const userPlaylistData=await PlayList.aggregate(pipeline)
  if(!userPlaylistData){
    throw new ApiErrorHandle(400,"Playlist Not Found")
   }
   return res.status(200).json(new ApiResponse(userPlaylistData,200,"Playlist Fetched Successfully!"))
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const {playlistId} = req.params
  //TODO: get playlist by id
  if(!playlistId){
    throw new ApiErrorHandle(400,"Playlist Id is Not Found");
  }
  const getPlaylist=await PlayList.findById(playlistId)
  if(!getPlaylist){
    throw new ApiErrorHandle(400,"Playlist Not Found!")
  }
  return res.status(200).json(new ApiResponse(getPlaylist,200,"Playlist Fetched Successfully!",))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.body;

  if ([playlistId, videoId].some((item) => item == "")) {
    throw new ApiErrorHandle(400, "All Field Required");
  }

   // Check if videoId already exists in the playlist
   const playlist = await PlayList.findById(playlistId);
   if(!playlist){
    throw new ApiErrorHandle(404,"Playlist Not Found")
   }
   if (playlist.videos.includes(videoId)) {
     throw new ApiErrorHandle(400, "Video already exists in the playlist");
   }

  const addedVideoToPlaylist=await PlayList.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );
  if(!addedVideoToPlaylist){
    throw new ApiErrorHandle(400, "Something Went Wrong!");
  }
  return res.status(200).json(new ApiResponse(addedVideoToPlaylist,200,"Video Added To Playlist"))
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const {playlistId, videoId} = req.body
  // TODO: remove video from playlist
  if([playlistId,videoId].some(item=>item === '')){
    throw new ApiErrorHandle(400,"Some Field is Missing")
  }
  const matchPlaylist=await PlayList.findById(playlistId)
  const matchVideo=await matchPlaylist?.videos.findByIdAndDelete(videoId)
  console.log(333,matchVideo)

})



export { createPlaylist,addVideoToPlaylist,getUserPlayLists,getPlaylistById,removeVideoFromPlaylist };
