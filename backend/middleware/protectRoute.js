import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'

const protectRoute = async(req, res ,next)=>{
    try{
        const token = req.cookies.jwt
        if(!token){
            return res.status(400).json({error : "unautherized : No token Provided"})
        }

        const decoded =  jwt.verify(token,process.env.JWT_SECRET)

        if(!decoded){
            return res.status(400).json({error : "unautherized : Invalid Token" })
        }

        const user = await User.findOne({_id : decoded.userId}).select("-password")

        if(!user){
            return res.status(400).json({error : "User Not Found"})
        }
        req.user = user;
        next()
    }
    catch(err){
        console.log(`Error in ProectRoute middleware ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }


}

export default protectRoute