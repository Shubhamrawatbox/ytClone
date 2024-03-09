import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { uploadFileCloud } from "../utils/FileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt, { decode } from "jsonwebtoken";
import mongoose from "mongoose";
import { sendEmail } from "../utils/sendMail.js";

// generate token
const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshsToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiErrorHandle(
      500,
      "Something Went Wrong While Generating Token"
    );
  }
};

// register user
const resgisterUser = asyncHandler(async (req, res) => {
  // get user details
  //validation -not empty
  //check if user is exist : username,email
  // check for image,avatar is required
  // upload them to cloudinary,avatar check
  // create user object -create entry in db
  // remove password and refresh token from response
  // check for user creation
  //return response
  const { username, email, fullname, password } = req.body;
  if (
    [fullname, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiErrorHandle(400, "All Field is required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (existedUser) {
    throw new ApiErrorHandle(409, "User Already exist");
  }

  let avatarLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiErrorHandle(400, "Avatar File is Required");
  }
  const avatar = await uploadFileCloud(avatarLocalPath);
  const coverImage = await uploadFileCloud(coverImageLocalPath);

  if (!avatar) {
    throw new ApiErrorHandle(400, "Avatar File is Required");
  }

  const user = await User.create({
    fullname,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    username: username.toLowerCase(),
    password,
    email,
  });
  const createdUser = await User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new ApiErrorHandle(500, "Something Went Wrong! ");
  }
  // send Email Verification
  const resp=await sendEmail({ email, emailType: "VERIFY", userId: createdUser?._id });
  return res
    .status(201)
    .json(new ApiResponse(createdUser, 201, "User Registered Successfully"));
});

// loin api
const loginUser = asyncHandler(async (req, res) => {
  // first get information from user
  // check empty condition
  // check user from db
  // if user not exist return null
  //check password
  //access and refresh token send to user
  //send cookies
  // send response

  const { email, password } = req.body;
  if ([email, password].some((field) => field?.trim() === "")) {
    throw new ApiErrorHandle(400, "Email and Password  is Required");
  }

  const findUser = await User.findOne({ email });

  if (!findUser) {
    throw new ApiErrorHandle(404, "User Not  Exist");
  }
  if (!findUser?.isVerified) {
    throw new ApiErrorHandle(400, "Please Verified First");
  }
  const isPasswordValid = await findUser.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiErrorHandle(401, "Invalid User Credential Please Check Again");
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    findUser?._id
  );
  const loggedInUser = await User.findById(findUser._id).select(
    "-password -refreshToken"
  );

  const options = {
    // cookies is modify only server
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        200,
        "User logged In Successfully"
      )
    );
});

// logout api

const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    // cookies is modify only server
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse({}, 200, "UserLogout Successfully"));
});

// refresh token
const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiErrorHandle(401, "unAuthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiErrorHandle(401, "Invalid Refresh Token ");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiErrorHandle(401, "Refresh Token is Expried or Used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
      user?._id
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(200, "Access Token Refreshed", {
          accessToken,
          refreshToken,
        })
      );
  } catch (error) {
    throw new ApiErrorHandle(500, error || "Something Went Wrong");
  }
});

// change Password
const changePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const checkPassword = await user.isPasswordCorrect(oldPassword);
  if (!checkPassword) {
    throw new ApiErrorHandle(400, "Invalid Password");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  return res
    .status(200)
    .json(new ApiResponse(200, "Password Change Successfully", {}));
});

// currentUser
const currentUser = asyncHandler(async (req, res) => {
  const user = await req.user;
  return res.status(200).json(new ApiResponse(200, "Current User", user));
});

// Update User
const updateUser = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;
  if (!(fullname && email)) {
    throw new ApiErrorHandle(400, "Required All Field");
  }
  const findUser = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { fullname, email } },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(findUser, 200, "Account Details Updated"));
});

// update Avatar
const updateAvatar = asyncHandler(async (req, res) => {
  const avatar = req.file?.path;
  if (!avatar) {
    throw new ApiErrorHandle(400, "Image is Required");
  }
  const fileUploadUrl = await uploadFileCloud(avatar);
  if (!fileUploadUrl?.url) {
    throw new ApiErrorHandle(400, "Error While Uploading");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { avatar: fileUploadUrl?.url } },
    { new: true }
  ).select("-password");
  return res.status(200).json(new ApiResponse(user, 200, "Avatar Updated"));
});

// channel profile
const getChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;
  if (!username) {
    throw new ApiErrorHandle(400, "Username is not Empty");
  }

  const channelDetails = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscriberCount: {
          $size: "$subscribers",
        },
        channelsSubscribeToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullname: 1,
        email: 1,
        username: 1,
        avatar: 1,
        coverImage: 1,
        subscriberCount: 1,
        channelsSubscribeToCount: 1,
        isSubscribed: 1,
      },
    },
  ]);

  if (!channelDetails.length) {
    throw new ApiErrorHandle(404, "No Channel Found");
  }
  return res
    .status(200)
    .json(new ApiResponse(channelDetails, 200, "Channel Fetched Suucessfully"));
});

// watched history
const getWatchedHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        user?.[0].watchHistory,
        200,
        "Watch history fetched successfully"
      )
    );
});

// get Subscribed

const subscribedChannel = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const user = req.user;
  const channel = await User.findOne({ username: username.toLowerCase() });
  const isAlreadySubscribed = await Subscription.findOne({
    subscriber: user._id,
  });

  if (!channel) {
    throw new ApiErrorHandle(404, "Channel Not Found");
  }

  if (!isAlreadySubscribed) {
    await Subscription.create({
      subscriber: user?._id,
      channel: channel?._id,
    });

    await Subscriber.findByIdAndUpdate(
      user?._id,
      { $push: { subscriber: user?._id } },
      { new: true }
    );

    const updatedChannelDetails = await User.aggregate([
      {
        $match: {
          username: username?.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: "$subscribers",
          },
        },
      },
      {
        $project: {
          subscriberCount: 1,
        },
      },
    ]);
    return res
      .status(200)
      .json(
        new ApiResponse(updatedChannelDetails, 200, "Subscribed Successfully")
      );
  } else {
    return res
      .status(400)
      .json(new ApiResponse({}, 400, "Already Subscribed Successfully"));
  }
});

export {
  resgisterUser,
  loginUser,
  logOutUser,
  refreshAccessToken,
  changePassword,
  currentUser,
  updateUser,
  updateAvatar,
  getChannelProfile,
  getWatchedHistory,
  subscribedChannel,
};
