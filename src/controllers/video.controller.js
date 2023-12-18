import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { uploadFileCloud } from "../utils/FileUpload.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const videoPublished = asyncHandler(async (req, res) => {
  //reqired filed not empty
  // upload video and images
  // check token is valid
  // if ok then video is pubished
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

  const videoFileUrl = await uploadFileCloud(videoFileLocalPath?.url);
  const thumbnailUrl = await uploadFileCloud(thumbnailLocalPath?.url);

  console.log(5555, videoFileUrl);
});

export { videoPublished };
