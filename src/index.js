import connectDB from "./database/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("Server Error :: ", error);
      throw error;
    });
    app.listen(process.env.PORT || 1000, () => {
      console.log(`Server is Running at ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB CONNECTION ERROR ::", error);
  });
