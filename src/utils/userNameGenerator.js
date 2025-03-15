import mongoose from "mongoose";

const generateUserName = async(name) =>{
    const baseUserName = name.toLowercase().replace(/\s+/g,'')//remove spaces
    .replace(/[^a-zA-Z0-9]/g,'')
    const uniqueUsername = baseUserName
    let counter = 1
while(await mongoose.model("User").exists({username:uniqueUsername})){
    uniqueUsername = `$baseUsername+${counter}`
    counter++
}
    return uniqueUsername
}

export {generateUserName}