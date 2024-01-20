import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadFileCloud } from "../utils/FileUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideo = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  const pipeline = [];

  if (userId) {
    pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(userId) } });
  }

  if (sortBy) {
    pipeline.push({ $sort: { [sortBy]: sortType === "desc" ? -1 : 1 } });
  }
  if (query) {
    pipeline.push({ $match: { title: query } });
  }

  //add pagination stages
  const startIndex = (page - 1) * limit;
  pipeline.push({ $skip: startIndex });
  pipeline.push({ $limit: parseInt(limit) });

  const videoModalAggegate = Video.aggregate(pipeline);
  const getAllVideos = await Video.aggregatePaginate(videoModalAggegate);
  return res
    .status(201)
    .json(new ApiResponse(getAllVideos, 200, "Video Fetched Successfully"));
});

const videoPublished = asyncHandler(async (req, res) => {
  //reqired filed not empty
  // upload video and images
  // check token is valid
  // if ok then video is pubished
  const currentUser = await req.user;
  const { title, description, isPublished } = req.body;
  if ([title, description, isPublished].some((field) => field?.trim() === "")) {
    throw new ApiErrorHandle(400, "All Filed is Required");
  }

  let videoFileLocalPath, thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoFileLocalPath = req.files.videoFile[0].path;
  }
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  const videoFileUrl = await uploadFileCloud(videoFileLocalPath);
  const thumbnaillUrl = await uploadFileCloud(thumbnailLocalPath);

  const publishVideo = await Video.create({
    title,
    description,
    isPublished,
    thumbnail: thumbnaillUrl?.url,
    videoFile: videoFileUrl?.url,
    duration: videoFileUrl?.duration,
    owner: currentUser?._id,
  });
  if (!publishVideo) {
    throw new ApiErrorHandle(500, "Something Went Wrong! ");
  }
  return res
    .status(201)
    .json(new ApiResponse(publishVideo, 201, "Video Published Successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  const videodetail = await Video.findById(videoId);
  return res
    .status(200)
    .json(new ApiResponse(videodetail, 200, "Video Details Successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description, thumbnail } = req.body;
  if(!videoId){
    throw new ApiErrorHandle(400, "Update Video Id is Mandatory");
  }
  if ([title, description, thumbnail].some((item) => item?.trim() === "")) {
    throw new ApiErrorHandle(400, "Field Not Empty");
  }

  const pipeline=[]
  pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(req.user?._id) } });
  const userVideo=await Video.aggregate(pipeline)


  if(!userVideo?.length){
    throw new ApiErrorHandle(403, "Unauthorized to delete this video");
  }

  let thumbnailLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }
  const updatedThumbnail = await uploadFileCloud(thumbnailLocalPath);


  const findVideo = await Video.findByIdAndUpdate(
    videoId,
    { $set: {title, description,thumbnail:updatedThumbnail?.url} },
    { new: true }
  );
  if(!findVideo){
    throw new ApiErrorHandle(400,"Video Upload Failed")
  }
  return res.status(200).json(new ApiResponse(findVideo,204,"Update Video Successfully"))
});

const deleteVideo=asyncHandler(async(req,res)=>{
  const { videoId } = req.params
  if(!videoId){
    throw new ApiErrorHandle(400, "Delete Video Id is Mandatory");
  }
  const pipeline=[]
  pipeline.push({ $match: { owner: new mongoose.Types.ObjectId(req.user?._id) } });

  const userVideo=await Video.aggregate(pipeline)

  if(!userVideo?.length){
    throw new ApiErrorHandle(403, "Unauthorized to delete this video");
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);
  // Check if the video was successfully deleted
  if (!deletedVideo) {
    throw new ApiErrorHandle(500, "Failed to delete video");
  }

  return res.status(200).json(new ApiResponse(deletedVideo,200,"Delete Video Successfully"))

})

export { videoPublished, getAllVideo, getVideoById,updateVideo,deleteVideo };
