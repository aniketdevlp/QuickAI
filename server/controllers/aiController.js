import OpenAI from "openai";
import sql from "../configs/db.js";
import { clerkClient } from "@clerk/express";
import {v2 as cloudinary} from 'cloudinary'
import dotenv from 'dotenv'
import fs from 'fs';
import axios from "axios";
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

dotenv.config();
cloudinary.config(true)

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultHeaders: {
        "x-goog-api-key": process.env.GEMINI_API_KEY
    },
});



export const generateArticle = async(req, res)=>{
    try{
        const userId = req.userId;
        const {prompt, length} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;
        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue."})
        }
        const targetWords = Number(length) || 500
        const maxTokensBuffer = Math.ceil(targetWords*1.8)+150;
        const formattedPrompt = `Write an in-depth, comprehensive article on the following topic. Target a length of approximately ${targetWords} words.\n\nTopic: ${prompt}`;
        const response = await AI.chat.completions.create({
            model: "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: formattedPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: maxTokensBuffer,
        });
        const content = response.choices[0].message.content
        await sql` insert into creations (user_id, prompt, content, type) values (${userId}, ${prompt}, ${content}, 'article')`;
        if(plan !== 'premium'){
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata:{
                    free_usage: free_usage+1
                }
            })
        }
        res.json({success:true, content})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}
export const generateBlogTitle = async(req, res)=>{
    try{
        const userId = req.userId;
        const {prompt} = req.body;
        const plan = req.plan;
        const free_usage = req.free_usage;
        if(plan !== 'premium' && free_usage >= 10){
            return res.json({success: false, message: "Limit reached. Upgrade to continue."})
        }
        const response = await AI.chat.completions.create({
    model: "gemini-3.6-flash",
    messages: [
        {
            role: "user",
            content: prompt,
        },
    ],
    temperature: 0.7,
    max_tokens: 3000,
});
const content = response.choices[0].message.content
    await sql` insert into creations (user_id, prompt, content, type) values (${userId}, ${prompt}, ${content}, 'blog-title')`;
    if(plan !== 'premium'){
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata:{
                free_usage: free_usage+1
            }
        })
    }
    res.json({success:true, content})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}
export const generateImage = async(req, res)=>{
    try{
        const userId = req.userId;
        const {prompt, publish} = req.body;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions."})
        }
        const formData = new FormData()
        formData.append('prompt', prompt)
        const{data} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, {
            headers:{'x-api-key': process.env.CLIPDROP_API_KEY,},
            responseType: "arraybuffer"
        })
        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').toString('base64')}`;

        const {secure_url} = await cloudinary.uploader.upload(base64Image)

        await sql` insert into creations (user_id, prompt, content, type, publish) values (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;
        
        res.json({success:true, content: secure_url})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}
export const removeImageBackground = async(req, res)=>{
    try{
        const userId = req.userId;
        const image = req.file;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions."})
        }
        
        const {secure_url} = await cloudinary.uploader.upload(image.path, {
            transformation: [
                {
                    effect: 'background_removal',
                    background_removal: 'remove_the_background'
                }
            ]
        })



        await sql` insert into creations (user_id, prompt, content, type) values (${userId}, 'Remove background from image', ${secure_url},'image')`;
        
        res.json({success:true, content: secure_url})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}
export const removeImageObject = async(req, res)=>{
    try{
        const userId = req.userId;
        const {object} = req.body;
        const image = req.file;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions."})
        }
        
        const {public_id} = await cloudinary.uploader.upload(image.path)

        const imageUrl = cloudinary.url(public_id, {
            transformation: [{effect: `gen_remove:${object}`}],
            resource_type: 'image'
        })

        await sql` insert into creations (user_id, prompt, content, type) values (${userId}, ${`Remove the ${object} from image`}, ${imageUrl},'image')`;
        
        res.json({success:true, content: imageUrl})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}
export const resumeReview = async(req, res)=>{
    try{
        const userId = req.userId;
        const resume = req.file;
        const plan = req.plan;
        if(plan !== 'premium'){
            return res.json({success: false, message: "This feature is only available for premium subscriptions."})
        }
        if(resume.size > 5*1024*1024){
            fs.unlinkSync(resume.path);
            return res.json({success: false, message: "Resume file size exceeds allowed size (5MB)."})
        }
        const base64Pdf = fs.readFileSync(resume.path).toString('base64');
        fs.unlinkSync(resume.path);
        const response = await AI.chat.completions.create({
            model: "gemini-3.6-flash",
            messages: [
                {
                    role: "user",
                    content: [
                        {
                        type: "text",
                        text: "Review the following resume and provide constructive feedback on its strengths, weaknesses, and areas for improvement."
                        },
                        {
                        type: "image_url",
                        image_url: { url: `data:application/pdf;base64,${base64Pdf}` }
                        }
                    ],
                },
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });
        const content = response.choices[0].message.content
        await sql` insert into creations (user_id, prompt, content, type) values (${userId}, 'Review uploaded resume', ${content},'resume-review')`;
        
        res.json({success:true, content})

    }catch(error){
        console.log(error.message)
        res.json({success:false, message:error.message})
    }

}