import path from "path";
import express from "express";
import dotenv from "dotenv";
import {v2 as cloudinary} from "cloudinary";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import postRoutes from "./routes/post.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import connectMongoDb from "./db/connectMongoDb.js";
import cookieParser from "cookie-parser";
import cors from "cors";

 dotenv.config();

 cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
 });


const app = express();
const PORT = process.env.PORT || 4000;
const __dirname = path.resolve();


app.use(express.json({ limit: '10mb' })); // default is 100kb
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const allowedOrigins = [
  'http://localhost:3000',
  'https://twitter-clone-tan-two.vercel.app',
   'https://twitter-clone-main-ibbb.onrender.com'
];

app.use(cookieParser());
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

//
app.get("/",(req,res)=>{
  res.send("Hello form Server");
})

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes)

if(process.env.NODE_ENV === "production")
{ app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });

}

app.listen(PORT , () => {
  console.log("Server is running on port " + PORT);
  connectMongoDb();
});


// server.js