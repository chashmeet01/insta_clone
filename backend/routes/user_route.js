import express from "express";
import { followeOrUnfollow, getProfile, getSuggestedUser, register } from "../controllers/user_controller.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const router = express.Router();

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/logout').post(logout);
router.route('/:if/profile').post(isAuthenticated, getProfile);
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePicture'), editProfile);
router.route('/followorununfollow').post(isAuthenticated, followeOrUnfollow);

export default router;


