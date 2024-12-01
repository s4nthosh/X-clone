import mongoose from "mongoose";

const connectDB =async()=>{
    try{
        await mongoose.connect(process.env.MONGO_URL)
        console.log("connected sucessfully")
    }
    catch(err){
        console.log(`Error in connecting Db ${err}`)
        process.exit(1) // 1 means true 0 means false
    }
}

export default connectDB;