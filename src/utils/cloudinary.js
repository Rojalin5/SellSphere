import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

import { v2 as cloudinary } from 'cloudinary';

    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    
    // Upload an image
     const uploadOnCloudinary = async(localFilePath) =>{
        try {
            if(!localFilePath) return null;
            const response = await cloudinary.uploader.upload(localFilePath,{
                resource_type:"auto"
            })
        //file has been uploaded
        // console.log("File has been uploaded on cloudinary", response.url)
        } catch (error) {
            fs.unlink(localFilePath)
            return null;
        }
     }
     export {uploadOnCloudinary}