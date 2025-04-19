import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    message:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["Order Update","Back In Stock","New Arrival","Account Activity"]
    },
    isread:{
        type:Boolean,
        default:false
    }
  },
  { timestamps: true }
);

export const Notification = mongoose.model("Notification", notificationSchema);
