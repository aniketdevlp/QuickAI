import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { clerkClient, clerkMiddleware, getAuth} from '@clerk/express'
import aiRouter from './routes/aiRoutes.js';
import connectCloudinary from './configs/cloudinary.js';
import userRouter from './routes/userRoutes.js';
const app = express()

await connectCloudinary


app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.get('/', (req,res)=>res.send('server is Live!'))
app.get('/protected', async (req, res) => {
  // Use `getAuth()` to get the user's `userId`
  const { isAuthenticated, userId } = getAuth(req)

  if (!isAuthenticated) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  // Use the `getUser()` method to get the user's User object
  const user = await clerkClient.users.getUser(userId)

  res.json({ user })
})
app.use('/api/ai', aiRouter)
app.use('/api/user', userRouter)
const PORT = process.env.PORT || 3000;

app.listen(PORT, ()=>{
    console.log('Server is running on port', PORT)
})