import { User } from "../models/user.model.js";
import { ApiErrorHandle } from "../utils/ApiErrorHandle.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const verifyEmail = asyncHandler(async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findOne({
        verifyToken: token,
        verifyTokenExpiry: { $gt: Date.now() },
    });
    if (!user) {
        return res.status(400).json(new ApiResponse({},400,"Invalid Token"))
    }
    (user.isVerified = true),
      (user.verifyTokenExpiry = undefined),
      (user.verifyToken = undefined);
      await user.save()
      return res.status(200).json(new ApiResponse({},200,"Verify User Succesfully"))
  } catch (error) {}
});


export {verifyEmail}
