import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
order:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Order",
    required:true
},
user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"User",
    required:true
},
amount:{
    type:Number,
    required:true
},
currency:{
    type:String,
    default:"INR"
},
paymentMethod:{
    type:String,
    enum:["Card","UPI","NetBanking","Wallet","COD"],
    required:true
},
gateway:{
    type:String,
    enum:["Razorpay", "Stripe", "PayPal", "COD"],
    required:true
},
transactionID:{
    type:String,
    required:true
},
paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed", "Refunded"],
    default: "Pending",
  },
  paymentResponse:{
    type:mongoose.Schema.Types.Mixed
  }
}
,{timestamps:true})

export const Payment = mongoose.model("Payment",paymentSchema)