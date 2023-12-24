import { Router } from "express";
import {
  changePassword,
  currentUser,
  getChannelProfile,
  getUserPlayList,
  getWatchedHistory,
  logOutUser,
  loginUser,
  refreshAccessToken,
  resgisterUser,
  updateAvatar,
  updateUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    {
      name: "coverImage",
      maxCount: 1,
    },
  ]),
  resgisterUser
);

router.route("/login").post(loginUser);
router.route("/logout").get(verifyJWT, logOutUser);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/changePassword").post(verifyJWT, changePassword);
router.route("/currentUser").get(verifyJWT, currentUser);
router.route("/updateUser").post(verifyJWT, updateUser);
router
  .route("/updateAvatar")
  .post(verifyJWT, upload.single("avatar"), updateAvatar);
router.route("/channelProfile/:username").get(verifyJWT, getChannelProfile);
router.route("/watchHistory").get(verifyJWT, getWatchedHistory);
router.route("/getUserPlaylist").get(verifyJWT, getUserPlayList);

export default router;
