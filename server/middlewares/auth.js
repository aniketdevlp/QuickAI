import { clerkClient, getAuth } from "@clerk/express";

// Middle ware to check userId and has PremiumPlan
export const auth = async (req, res, next) =>{
    try {
        const {userId, has} = getAuth(req);
        if(!userId){
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        req.userId = userId;
        const hasPremiumPlan = Boolean(has({plan: 'premium'}))

        const user = await clerkClient.users.getUser(userId)
        if(!hasPremiumPlan && user.privateMetadata.free_usage){
            req.free_usage = user.privateMetadata.free_usage
        }else{
            await clerkClient.users.updateUserMetadata(userId, {privateMetadata : {
                free_usage: 0
            }})
            req.free_usage = 0;
        }
        req.plan = hasPremiumPlan ? 'premium' : 'free'
        next()
    } catch (error) {
        res.json({success: false, message: error.message})
    }
}