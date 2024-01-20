import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  addVideoToPlaylist,
  createPlaylist,
  getPlaylistById,
  getUserPlayLists,
  removeVideoFromPlaylist,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/createPlaylist").post(verifyJWT, createPlaylist);
router.route("/addVidePlaylist").post(verifyJWT, addVideoToPlaylist);
router.route("/userPlaylist").get(verifyJWT, getUserPlayLists);
router.route("/getPlaylistById/:playlistId").get(verifyJWT, getPlaylistById);
router.route("/removeVideoPlaylist").delete(verifyJWT, removeVideoFromPlaylist);

export default router;
