import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import generateToken from "../utils/generateToken.js";

export const signup = async(req,res)=>{
    try{
        const { username , fullname , email , password } = req.body

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if(!emailRegex.test(email)){
            return res.status(400).json({error : "Invalid email formate "})
        }

        const existingEmail = await User.findOne({email : email})
        const existingUsername =  await User.findOne({username : username})

        if(existingEmail || existingUsername){
            return res.status(400).json({error : "Already existing username or email"})
        }
        if(username.length < 3 && fullname.length < 3){
            return res.status(400).json({error:"Invalid Name Type "})
        }

        if(password.length < 8){
            return res.status(400).json({error : "Password must have atleast 8 char length"})
        }

        // hashing the password
        // 123456 = jid5w[78&*3(%@)]

        const salt = await bcrypt.genSalt(12)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new User({
            username : username ,
            fullname : fullname ,
            email : email ,
            password : hashedPassword
        })

        if(newUser){
            generateToken(newUser._id,res)
            await newUser.save()
            res.status(200).json({message : " Created sucessfully go back to login page "})
        }
        else{
            res.status(400).json({error : "Invaild User Data"})
        }



    }
    catch(err){
        console.log(`Error in signup ${err}`)
        res.status(500).json({ error:"Internal Server Error"})
    }
}
export const login = async(req,res)=>{
    try{
        const {username , password} = req.body

        const user = await User.findOne({username : username})
        const isPasswordCorrect = await bcrypt.compare(password,user?.password || "")

        if(!user||!isPasswordCorrect){
            return res.status(400).json({error : "Invalid Username or Password"})
        }

        generateToken(user._id,res)

        res.status(200).json({message : "Login Sucessfully"})

    }
    catch(err){
        console.log(`Error in login ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }
}
export const logout = async(req,res)=>{
    try{
        res.cookie("jwt" , "" , {maxAge : 0} )
        res.status(200).json({message : "Logout Sucessfully"})
    }
    catch(err){
        console.log(`Error in logout ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }
}
export const getMe = async(req,res)=>{
    try{
        const user = await User.findOne({_id : req.user._id}).select("-password")
        res.status(200).json(user)
    }
    catch(err){
        console.log(`Error in getMe controller ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }
}