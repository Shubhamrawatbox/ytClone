import { Router } from "express";
import {
  deleteVideo,
  getAllVideo,
  getVideoById,
  updateVideo,
  videoPublished,
} from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload").post(
  upload.fields([
    {
      name: "videoFile",
      maxCount: 1,
    },
    {
      name: "thumbnail",
      maxCount: 1,
    },
  ]),
  verifyJWT,
  videoPublished
);

router.route("/getAllVideo").get(getAllVideo);
router.route("/getVideoDetails/:videoId").get(getVideoById);
router
  .route("/updateVideo/:videoId")
  .post(
    upload.fields([{ name: "thumbnail", maxCount: 1 }]),
    verifyJWT,
    updateVideo
  );
router.route("/deleteVideo/:videoId").delete(verifyJWT, deleteVideo);


export default router;
