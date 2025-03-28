import {User} from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
const generateAccessAndRefreshToken = async(userID)=>{
   try {
     const user = await User.findById(userID)
     if(!user){
         throw new ApiError(404,"User not found")
     }
     const accessToken = await user.generateAccessToken()
     const refreshToken = await user.generateRefreshToken() 
    //  console.log("Generated Access Token:", accessToken);  // Debugging
    //  console.log("Generated Refresh Token:", refreshToken); 
     user.refreshToken = refreshToken
     await user.save({validateBeforeSave:false})
 
     return {accessToken,refreshToken}
   } catch (error) {
    console.log("Error while Generating Token ::",error)
    throw new ApiError(500,"Something went wrong while generating token")
   }
}

export {generateAccessAndRefreshToken}