import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import bcrypt from "bcryptjs"
import coludinary from "cloudinary"

export const getProfile = async(req,res)=>{
    try{
        const{username} = req.params;

        const user = await User.findOne({username : username})

        if(!user){
            return res.status(400).json({error : "User Not Found"})
        }

        res.status(200).json(user)
    }
    catch(err){
        console.log(`Error in getProfile ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }
}

export const followUnfollowUser = async(req,res)=>{
    try{
        const {id} = req.params

        const userToModify = await User.findById({_id : id})

        const currentUser = await User.findById({_id : req.user._id}) //it check the user in protectRoute 

        if(id === req.user._id){
            // not modify yourself,follow and unfollow
            return res.status(400).json({error:"You Can't follow/unfollow yourself "})
        }

        if(!userToModify || !currentUser ){
            return res.status(400).json({error:"User Not Found"})
        }

        const isFollowing = currentUser.following.includes(id)

        if(isFollowing){
            //unfollow
            await User.findByIdAndUpdate({_id: id},{$pull:{followers:req.user._id}})
            await User.findByIdAndUpdate({_id:req.user._id},{$pull:{following:id}})
            res.status(200).json({message:"unfollow successfully"})

        }else{
            //follow
            await User.findByIdAndUpdate({_id:id},{$push:{followers:req.user._id}})
            await User.findByIdAndUpdate({_id:req.user._id},{$push:{following:id}})
            
            // send notification

            const newNotification = new Notification({
                type : "follow",
                from : req.user._id,
                to : userToModify._id
            })
            await newNotification.save()
            res.status(200).json({message:"follow successfully"})

        }


    }
    catch(err){
        console.log(`Error in follow and unfollow ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }

}

export const getsuggestedUser = async(req,res)=>{
    try{
        const userId = req.user._id;
        const userFollowedByMe = await User.findById({_id:userId}).select("-password")

        const users = await User.aggregate([
            {
                $match : {
                    _id : { $ne : userId } // $ne means not equal to 
                }
            },{
                $sample : {
                    size : 10
                }
            }
        ])

        const filteredUser = users.filter((user)=> !userFollowedByMe.following.includes(user._id)) //logic this method filter ur following and takes out the user your not following
        
        const suggestedUser = filteredUser.slice(0,4)

        suggestedUser.forEach((user)=>user.password = null)

        res.status(200).json(suggestedUser)
    }
    catch(err){
        console.log(`Error in suggestedUser ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }

}

export const updateUser = async(req,res)=>{
    try{
        const userId = req.user._id
        
        // change the data thats why using let
        const { username , fullname , email , currentPassword , newPassword , bio , link } = req.body

        let { profileImg , coverImg} = req.body
        
        let user = await User.findById({_id :userId})
        
        if(!user){
            return res.status(404).json({error : "User not Found"})
        }

        if((!newPassword && currentPassword)||(!currentPassword && newPassword)){
            return res.status(400).json({error : "please Provide both current password and new Password "})
        }

        if(currentPassword && newPassword){
            const isMatch = await bcrypt.compare(currentPassword , user.password)
            if(!isMatch){
                return res.status(400).json({error : "Current password is incorrect"})

            }
            if(newPassword.length < 8){
                return res.status(400).json({error : "Password Must have atleast 8 char"})
            }

            const salt = await bcrypt.genSalt(12)

            user.password = await bcrypt.hash(newPassword,salt)

        }

        if(profileImg){
            // this method is used to if the p-img already exist and it will make it has replace or delete the p-img

            // eg: http://somesite/somepath/securedid/imageid.type(.jepg||.png) this method the first split is used to separated the site using '/' eg: 'http','someside',.... and pop is used to take the last value of the site in this case 'imageid.jepg' and again split is used to separate by '.' so it have two arrays the first array have imageid and the second array have jepg and [0] is used to find the index of the array so it the the id and destroy 

            if(user.profileImg){
                await coludinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0])
            }


            // this method is used to add img when there is no img 
            const uploadedResponse = await coludinary.uploader.upload(profileImg)
            profileImg = uploadedResponse.secure_url
        }

        if(coverImg){
            // this method is used to if the c-img already exist and it will make it has replace or delete the c-img

            if(user.coverImg){
                await coludinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0])
            }

            // this method is used to add img when there is no img
            const uploadedResponse = await coludinary.uploader.upload(coverImg)
            coverImg = uploadedResponse.secure_url
        }

        user.fullname = fullname || user.fullname
        user.email = email || user.email
        user.username = username || user.username
        user.bio = bio || user.bio
        user.link = link || user.link
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg

        user =  await user.save()

        ///password is null in res it not affect the db
        user.password = null

        return res.status(200).json(user)
    }
    catch(err){
        console.log(`Error in UpdateUser ${err}`)
        res.status(500).json({error : "Internal Server Error"})
    }
}