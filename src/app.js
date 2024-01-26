import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "10MB" }));
app.use(express.urlencoded({ extended: true, limit: "1MB" }));
app.use(express.static("public"));
app.use(cookieParser());

// routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";
import playlistRouter from './routes/playlist.routes.js';
import likeRouter from './routes/like.routes.js';

// routes declare
app.use("/api/v1/users", userRouter);
app.use("/api/v1/video", videoRouter);
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/like",likeRouter)

export { app };
