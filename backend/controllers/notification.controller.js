import Notification from "../models/notification.model.js"
import User from "../models/user.model.js"

export const getNotification = async(req,res)=>{
    try{
        const userId = req.user._id
        


        const notification = await Notification.find({to: userId ,from:{$ne:userId}})
                    .populate({
                        path:"from",
                        select : "username profileImg "
                    })          
            
        await Notification.updateMany({to:userId},{read:true})
        res.status(200).json(notification)           
    }
    catch(err){
        console.log(`Error in getNotification ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }

}

export const deleteNotification = async(req,res)=>{
    try{
        const userId = req.user._id

        await Notification.deleteMany({to:userId})

        res.status(200).json({message:"Notification Deleted Successfully"})
    }
    catch(err){
        console.log(`Error in deleteNotification ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}