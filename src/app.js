import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(express.json({ limit: "20kb" }));
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(express.static("public"))
app.use(cookieParser())


//routes
import userRouter from "./routes/user.routes.js"


//route declaration
app.use("/api/v1/users",userRouter)



//Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    return res.status(statusCode).json({
        success: false,
        statusCode,
        message: err.message || "Internal Server Error",
        errors: err.errors || [],
    });
});

export default app;
