import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { User } from "../models/user.model.js";
import { uploadFileCloud } from "../utils/FileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt, { decode } from "jsonwebtoken";

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
      $set: {
        refreshToken: undefined,
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
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiErrorHandle(401, "Invalid Refresh Token ");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiErrorHandle(401, "Refresh Token is Expried or Used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user?._id);

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

export { resgisterUser, loginUser, logOutUser,refreshAccessToken };
