import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import userRouter from "./routes/user/user.routes.js";
import adminRouter from "./routes/admin/admin.routes.js";
import cookieParser from "cookie-parser";
import nocache from "nocache";


dotenv.config();
process.setMaxListeners(20);
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(express.json());
app.use(cookieParser());
app.use(nocache());
app.use(
  cors({
    origin:[process.env.CLIENT_URL,process.env.LOCAL_CLIENT_URL] ,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "authorization",'x-admin-authorization'],
    credentials: true,
  })
);
// Routers
app.use("/api/user", userRouter);
app.use("/api/admin", adminRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("something went wrong");
  console.error(err.stack);

  res.status(500).json({ message: "Something went wrong!" });
});
const PORT = process.env.PORT || 3000;
connectDB();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  
});
