import cloudinary from "cloudinary"
import Post from "../models/post.model.js"
import User from "../models/user.model.js"
import Notification from "../models/notification.model.js"

export const createPost = async(req,res) => {
    try{
        const {text} = req.body
        let {img} = req.body
        let userId = req.user._id.toString() //this method is used to take the userId for current user from protectroute

        const user = await User.findOne({_id: userId})

        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }

        if(!text && !img){
            return res.status(400).json({error:"post must have text or image"})
        }

        if(img){
            const uploadedResponse = await cloudinary.uploader.upload(img)
            img = uploadedResponse.secure_url   
        }

        const newPost = new Post({
            user : userId,
            text : text,
            img : img
        })
        await newPost.save()
        res.status(201).json(newPost) //201 is used to if anything create new 
    }
    catch(err){
        console.log(`Error in Post Controller ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const deletePost = async(req,res)=>{
    try{
        const {id} = req.params

        const post = await Post.findOne({_id:id})

        if(!post){
            return res.status(404).json({error:"Post Not Found"})
        }

        // this method i used to delete only the current user created post only not access to other post delete
        if(post.user.toString() !== req.user._id.toString()){
            return res.status(401).json({error:"your not autherized to delete the post"}) // 401 for auth
        }

        if(post.img){
            const imgId = post.img.split("/").pop().split(".")[0]
            await cloudinary.uploader.destroy(imgId)
        }
        await Post.findByIdAndDelete({_id:id})
        res.status(200).json({message:"post delete successfully"})
    }
    catch(err){
        console.log(`Error in deletePost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const createComment = async(req,res)=>{
    try{
        const {text} = req.body
        const postId = req.params.id
        const userId = req.user._id

        if(!text){
            return res.status(400).status({error:"comment text is required"})
        }
        const post = await Post.findOne({_id:postId})

        if(!post){
            return res.status(404).json({error:"Post Not Found"})
        }

        const comment = {
            user : userId,
            text : text,
        }

        // post comments has array so push
        post.comments.push(comment)
        await post.save()
        // for notification

        res.status(200).json({post})
    }
    catch(err){
        console.log(`Error in CreateComment ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
    

}

export const likeUnlikePost = async(req,res)=>{
    try{
        const userId = req.user._id

        const {id:postId} = req.params  // change id into postId to easily understand purpose
        
        const post = await Post.findOne({_id : postId})

        if(!post){
            return res.status(404).json({error:"Post Not Found"})
        }

        const userLikedPost = post.likes.includes(userId)

        if(userLikedPost){
            //unlike post
            await Post.updateOne({_id :postId},{$pull :{likes : userId}}) //this method only update the data
            await User.updateOne({_id :userId},{$pull :{likedPosts : postId }})

            const updatedLikes =post.likes.filter((id)=>id.toString() !==userId.toString()) // this will check my id and post id if its not match show all id`s
            res.status(200).json(updatedLikes)
        }
        else{
            //like post

            // await Post.updateOne({_id:postId},{$push:{likes :userId}})

            post.likes.push(userId)
            await User.updateOne({_id:userId},{$push: {likedPosts : postId}}) 
            await post.save()

            

            const notification = new Notification({
                from : userId,
                to : post.user,
                type : "like"
            })
            await notification.save()
            const updatedLikes=post.likes
            res.status(200).json(updatedLikes)
        }

    }
    catch(err){
        console.log(`Error in likeUnlikePost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const getAllPosts = async(req,res)=>{
    try{
        const posts = await Post.find().sort({createdAt:-1}).populate({
            path : "user",
            select :"-password"
        })
        .populate({
            path : 'comments.user',
            select : ["-password" , "-email", "-following" , "-followers" , "-bio" , "-link" ]
        })
         
        if(posts.length ===0){
            return res.status(200).json([])
        }
        res.status(200).json(posts)
    }
    catch(err){
        console.log(`Error in getAllPost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const getLikedPosts = async(req,res)=>{
    try{
        const userId = req.params.id
        const user = await User.findById({_id:userId})
        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }
        const likedPosts = await Post.find({_id :{$in : user.likedPosts}})   //$in means includes 
            .populate({
                path:"user",
                select : "-password"
            })
            .populate({
                path:"comments.user",
                select : ["-password" , "-email", "-following" , "-followers" , "-bio" , "-link" ]
            })
            res.status(200).json(likedPosts)
    }
    catch(err){
        console.log(`Error in getLikedPost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }

}

export const getFollowingPosts = async(req,res)=>{
    try{
        const userId = req.user._id
        const user = await User.findOne({_id:userId})
        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }

        const following = user.following

        const feedPosts = await Post.find({user:{$in : following}})
                            .sort({createdAt:-1})
                            .populate({
                                path:"user",
                                select:"-password"
                            })
                            .populate({
                                path:"comments.user",
                                select : "-password"

                            })
           res.status(200).json(feedPosts)                 
    }
    catch(err){
        console.log(`Error in getFollowingPost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}

export const getUserPosts = async(req,res)=>{
    try{
        const {username} = req.params
        const user = await User.findOne({username : username})

        if(!user){
            return res.status(404).json({error:"User Not Found"})
        }

        const posts = await Post.find({user : user._id})
                        .sort({
                            createdAt : -1
                        })
                        .populate({
                            path:"user",
                            select : "-password"
                        })
                        .populate({
                            path:"comments.user",
                            select : "-password"
                        })
          res.status(200).json(posts)              
    }
    catch(err){
        console.log(`Error in getUserPost ${err}`)
        res.status(500).json({error:"Internal Server Error"})
    }
}