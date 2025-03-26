import { User } from "../models/user.models.js";

const generateUserName = async(name) =>{
    const baseUserName = name.toLowerCase().replace(/\s+/g,'')//remove spaces
    .replace(/[^a-zA-Z0-9]/g,'')
    let uniqueUsername = baseUserName
    let counter = 1
while(await User.exists({username:uniqueUsername})){
    uniqueUsername = `${baseUserName}${counter}`
    counter++
}
    return uniqueUsername
}

export {generateUserName}