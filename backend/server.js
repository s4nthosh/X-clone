import express from "express"
import dotenv from "dotenv"
import authRoute from "./routes/auth.route.js"
import connectDB from "./db/connectDB.js"
import cookieParser from "cookie-parser"
import userRoute from "./routes/user.route.js"
import  cloudinary from "cloudinary"
import postRoute from "./routes/post.route.js"
import notificationRoute from "./routes/notification.route.js"
import cors from "cors"

import path from "path" //it is inbuild module from node 

dotenv.config()
const app = express()
const __dirname = path.resolve() //it is used to take the path of the server or to get folder location

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY ,
    api_secret : process.env.CLOUDINARY_SECRET_KEY
})


const PORT = process.env.PORT


app.use(express.json(
    {
        limit:"5mb" //default value 100kb we need to change to 5mb why bcuz  post will be uploaded
    }
))
app.use(cookieParser())
// its middleware to allow the side
app.use(cors(
    {
        origin : "http://localhost:3000",
        credentials :true, // it alow the cookies

    }
))

app.use(express.urlencoded({
    extended : true
}))

app.use("/api/auth",authRoute)
app.use("/api/users", userRoute )
app.use("/api/posts",postRoute)
app.use("/api/notifications",notificationRoute)


if(process.env.NODE_ENV === "production"){
    app.use(express.static(path.join(__dirname,"/frontend/build")))
    app.use("*",(req,res)=>{
        res.sendFile(path.resolve(__dirname,"frontent","build","index.html"))
    })
}

app.listen(PORT,()=>{
    console.log(`server is running on port number:${PORT}`)
    connectDB()
})
