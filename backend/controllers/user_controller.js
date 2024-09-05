import {User} from "../models/user_model.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import getDataUri from "../utils/datauri.js";

export const register = async (req,res) => {
    try{
        const {username, email, password} = req.body;
        if(!username || !email || !password){
            return res.status(401).json({
                message: "Please fill in all fields.", 
                success:false,
            });
        }
        const user = await User.findOne({email});
        if(user){
            return res.status(401).json({
                message: "Try different email.", 
                success:false,
            });
        };
        const hashedPassword = await bcrypt.hash(password, 10);
        await User.create({
            username,
            email,
            password: hashedPassword,
        })
        return res.status(201).json({
            message: "Account created successfully.", 
            success:true,
        });
    }catch (error){
        console.log(error)
    }
};

export const login = async (req,res) =>{
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(401).json({
                message: "Please fill in all fields.", 
                success:false,
            });
        }
        let user= await User.findOne({email});
        if(!user){
            return res.status(401).json({
                message: "Incorrect Username or Password.", 
                success:false,
            });
        }
        const isPasswordMatch = await bcrypt.compare(password,user.password);
        if(!isPasswordMatch){
            return res.status(401).json({
                message: "Incorrect Password.", 
                success:false,
            });
        };
        user= {
            _id:user._id,
            username:user.username,
            email:user.email,
            profilePicture:user.profilePicture,
            bio:user.bio,
            followers:user.followers,
            following:user.following,
            posts:user.posts
        }
        const token = await jwt.sign({id:user._id}, process.env.SECRET_KEY,{expiresIn:'1d'});
        return res.cookie('token',token, {httpOnly:true, sameSite:'strict',maxAge:1*24*60*1000}).json({
            message:'Welcome back ${user.username',
            success:true,
        });
    }catch (error){
        console.log(error);
    }
};

export const logout = async (_ , res) =>{
    try{
        return res.cookie("token", "", {maxAge:0}).json({
            message:'Logged out successfully',
            success: true
        });
    }catch (error){
        console.log(error);
    }
};
export const getProfile = async(req,res) => {
    try{
        const userId = req.parents.id;
        let user = await User.findById(userId);
        return res.status(200).json({
            user,
            success:true
        });
    }catch(error){
        console.log(error);
    }
};

export const editProfile = async (req,res) =>{
    try{
        const userId = req.id;
        const{bio, gender}= req.body;
        const profilePicture = req.file;
        let cloudResponse;

        if(profilePicture){
            const fileUri = getDataUri(profilePicture);
            cloudResponse= await cloudinary.uploader.upload(fileUri);
        }
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message:'User not found',
                success:false
            })
        };
        if(bio) user.bio = bio;
        if(gender) user.gender = gender;
        if(profilePicture) user.profilePicture = cloudResponse.secure_url;

        await user.save();

        return res.status(200).json({
            message:'Profile Updated',
            success:true,
            user
        })

    }catch(error){
        console.log(error);
    }
};

export const getSuggestedUser = async (req,res) =>{
    try {
        const suggestedUser = await User.find({_id:{$ne:req.id}}).select("-password");
        if(!suggestedUser){
            return res.status(400).json({
                message:'Currently do not have any users',
            })
        };
        return res.status(200).json({
            success:true,
            user:suggestedUser
        })
    } catch (error) {
        console.log(error);
    }
};

export const followeOrUnfollow = async (req,res) =>{
    try {
        const us_follow = req.id;      //follow karne wala
        const pot_follow = req.body.userId; //jisko folllow karna hai
        if(us_follow === pot_follow){
            return res.status(400).json({
                message:'tou cannot follow or unfollow yourself',
                success:false
            })
        }

        const user = await User.findById(us_follow);
        const targetUser = await User.findById(pot_follow);

        if(!user || !targetUser){
            return res.status(400).json({
                message:'User not found',
                success:false
            });
        }

        const isFollowing = user.following.includes(pot_follow);
        if(isFollowing){
            await Promise.all([
            User.updateOne({_id:us_follow},{$pull:{following:pot_follow}}),
            User.updateOne({_id:pot_follow},{$pull:{followers:us_follow}}),
            ])
            return res.status(200).json({message:'Unfollowed successfully', success:true});
        }else{
            await Promise.all([
                User.updateOne({_id:us_follow},{$push:{following:pot_follow}}),
                User.updateOne({_id:pot_follow},{$push:{followers:us_follow}}),
            ])
            return res.status(200).json({message:'Followed successfully', success:true});
        }
    } catch (error) {
        console.log(error);
    }
}