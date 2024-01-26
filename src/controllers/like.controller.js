import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { Like } from "../models/likes.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video

  if (!mongoose.isValidObjectId(videoId)) {
    throw new ApiErrorHandle(400, "Enter Valid Video Id");
  }


  const like = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  if (like.length <= 0) {
    await Like.create({
      likedBy: req.user?._id,
      video: videoId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "Like Video Successfully!", { isLiked: true })
      );
  } else {
    await Like.deleteOne({ _id: like[0]._id });
    return res
      .status(200)
      .json(
        new ApiResponse(200, "UnLike Video Successfully!", { isLiked: false })
      );
  }
});

export { toggleVideoLike };
