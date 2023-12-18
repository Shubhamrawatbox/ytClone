import { Router } from "express";
import { logOutUser, loginUser, refreshAccessToken, resgisterUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import {verifyJWT} from '../middlewares/auth.middleware.js'

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

router.route('/logout').get(verifyJWT,logOutUser)
router.route('/refreshToken').post(refreshAccessToken)

export default router;
