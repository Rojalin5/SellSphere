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
  try {
    console.log("🔍 Extracting Public ID from URL:", url);

    const urlParts = url.split("/");
    const fileNameWithExtension = urlParts.pop();
    const fileName = fileNameWithExtension.split(".")[0];


    const publicID = `${fileName}`;

    console.log("Corrected Public ID:", publicID);
    return publicID;
  } catch (error) {
    console.log("Error Extracting Public ID:", error);
    return null;
  }
};

const deleteFileFromCloudinary = async (publicID) => {
  try {
    if (!publicID) {
      console.log("Invalid Public ID:", publicID);
      return;
    }

    console.log("Deleting Public ID:", publicID);

    // Delete the file with invalidation to ensure it's removed
    const result = await cloudinary.uploader.destroy(publicID, { invalidate: true });

    if (result.result === "not found") {
      console.log("File not found in Cloudinary. Double-check the public ID.");
    } else {
      console.log("File successfully deleted from Cloudinary!", result);
    }
  } catch (error) {
    console.error("Error while deleting file from Cloudinary:", error);
  }
};

export { uploadOnCloudinary, extractpublicIDFromUrl, deleteFileFromCloudinary };
