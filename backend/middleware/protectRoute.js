import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.jwt;
        if(!token){
            return res.status(401).json({ message: "Unauthorized: No token found" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId).select("-password");

        if(!user){
            return res.status(404).json({ message: "Unauthorized: User not found" });
        }

        req.user = user;    
        next();
    } catch (error) {
        console.log("Error in protectRoute middleware", error.message);
        return res.status(500).json({ message: "Server error" });
    }
}