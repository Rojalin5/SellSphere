import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();
// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Upload an image
const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    return null;
  }
};

const extractpublicIDFromUrl = (url) => {
  const urlParts = url.split("/");
  const fileName = urlParts[urlParts.length - 1].split(".")[0];
  return `${urlParts[urlParts.length - 2]}/${fileName}`;
};

const deleteFileFromCloudinary = async (publicID) => {
  try {
    const result = await cloudinary.uploader.destroy(publicID);
    if (result.result == "not found") {
      console.log("File not found in cloudinary");
    } else {
      console.log("File has been Deleted!", result);
    }
  } catch (error) {
    console.log("Error while deleting file from cloudinary", error);
  }
};
export { uploadOnCloudinary, extractpublicIDFromUrl, deleteFileFromCloudinary };
