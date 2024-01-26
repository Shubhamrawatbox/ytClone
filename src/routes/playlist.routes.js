import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlayLists,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();
router.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

router.route("/createPlaylist").post(createPlaylist);
router.route("/addVidePlaylist").post(addVideoToPlaylist);
router.route("/userPlaylist").get(getUserPlayLists);
router.route("/getPlaylistById/:playlistId").get(getPlaylistById);
router.route("/removeVideoPlaylist").delete(removeVideoFromPlaylist);
router.route("/removePlaylist/:playlistId").get(deletePlaylist);

export default router;
