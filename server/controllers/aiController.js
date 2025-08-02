import OpenAI from "openai";
import sql from "../config/db.js";
import { clerkClient } from "@clerk/express";
import axios from 'axios'
import {v2 as cloudinary} from 'cloudinary'
import FormData from "form-data";
import fs from 'fs'
import pdf from 'pdf-parse/lib/pdf-parse.js'

const AI = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

// Generating Article
export const generateArticle = async (req, res) => {

  try {
    const { userId } = req.auth();
    const { prompt, lenght } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: lenght,
    });

    const content = response.choices[0].message.content

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'article')`

    if (plan !== 'premium') {
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {free_usage: free_usage + 1}
        })
    }

    res.json({success: true, content})

  } catch (error) {
    console.log(error.message);
    res.json({success: false, message: error.message})
  }
};

// Generating Blog Title
export const generateBlogTitle = async (req, res) => {

  try {
    const { userId } = req.auth();
    const { prompt } = req.body;
    const plan = req.plan;
    const free_usage = req.free_usage;

    if (plan !== "premium" && free_usage >= 10) {
      return res.json({
        success: false,
        message: "Limit reached. Upgrade to continue.",
      });
    }

    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{ role: "user", content: prompt,}],
      temperature: 0.7,
      max_tokens: 100,
    });

    const content = response.choices[0].message.content

    await sql`INSERT INTO creations (user_id, prompt, content, type) VALUES (${userId}, ${prompt}, ${content}, 'blog-title')`

    if (plan !== 'premium') {
        await clerkClient.users.updateUserMetadata(userId, {
            privateMetadata: {free_usage: free_usage + 1}
        })
    }

    res.json({success: true, content})

  } catch (error) {
    console.log(error.message);
    res.json({success: false, message: error.message})
  }
};

// Generating Image
export const generateImage = async (req, res) => {

  try {
    const { userId } = req.auth();
    const { prompt, publish } = req.body;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // clip-drop API
    const formData = new FormData()

    formData.append('prompt', prompt)
    
    const {data, headers} = await axios.post("https://clipdrop-api.co/text-to-image/v1", formData, 
      {headers: {'x-api-key': process.env.CLIPDROP_API_KEY, ...formData.getHeaders(),}, responseType: "arraybuffer",})

    if (headers["content-type"].startsWith("image/")) {
      
       const base64 = Buffer.from(data, "binary").toString("base64");
       const imageData = `data:${headers["content-type"]};base64,${base64}`;

       const {secure_url} = await cloudinary.uploader.upload(imageData);
       await sql`INSERT INTO creations (user_id, prompt, content, type, publish) 
              VALUES (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`

       return res.json({success: true, content: secure_url})
    }else {
       
      const errorMsg = Buffer.from(data).toString("utf-8");
      console.log("Clipdrop Error:", errorMsg);
      return res.status(500).json({ error: "Clipdrop error", details: errorMsg });
    }
  }

    // const base64Image = `data: image/png; base64, ${Buffer.from(data, 'binary').toString('base64')}`

    // const {secure_url} = await cloudinary .uploader.upload(base64Image)
  catch (error) {
    console.log(error.message);
    res.json({success: false, message: error.message})
  }
};

// Removing Image Background
export const removeImageBackground = async (req, res) => {

  try {
    const { userId } = req.auth();
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

     // Check if image file exists
    if (!image || !image.path) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    // Upload to Cloudinary with background removal
    const {secure_url} = await cloudinary.uploader.upload(image.path, {transformation: [
      { effect: 'background_removal', background_removal: 'remove_the_background' }
    ]})

    // checking if url exists(prevent credit loss)
     if (!secure_url) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary did not return an image URL.",
      })}

     // Save to DB
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, 'Remove background from image', ${secure_url}, 'image')`;
    
    //  // Clean up local file
    // fs.unlink(image.path, (err) => {
    //   if (err) console.error("File cleanup error:", err);
    // });

    res.json({success: true, content: secure_url})
    
  }catch (error) {
    console.error("Remove BG Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Removing Image Object
export const removeImageObject = async (req, res) => {

  try {
    const { userId } = req.auth();
    const { object } = req.body;
    const image = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

    // Checking if file is present
    if (!image || !image.path) {
      return res.status(400).json({
        success: false,
        message: "No image file provided.",
      });
    }

    // Upload image to Cloudinary
    const {public_id} = await cloudinary.uploader.upload(image.path)

    if (!public_id) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary upload failed.",
      });
    }

    // Generate URL with object removal transformation
    const imageUrl = cloudinary.url(public_id, {
      transformation: [{effect: `gen_remove:${object}`}], 
      resource_type: 'image'
    })

    // Insert into DB
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, ${`Removed ${object} from image`}, ${imageUrl}, 'image')`;

    // // Clean up file
    // fs.unlink(image.path, (err) => {
    //   if (err) console.error("File cleanup error:", err);
    // });

    res.json({success: true, content: imageUrl})
    
  }catch (error) {
    console.log("Remove Object Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reviewing Resume
export const resumeReview = async (req, res) => {

  try {
    const { userId } = req.auth();
    const resume = req.file;
    const plan = req.plan;

    if (plan !== "premium") {
      return res.json({
        success: false,
        message: "This feature is only available for premium subscriptions.",
      });
    }

   // Check if resume file is present
    if (!resume || !resume.path) {
      return res.status(400).json({
        success: false,
        message: "No resume file provided.",
      });
    }

   // checking resume file size (5MB max)
   if (resume.size > 5 *1024 *1024) {
    return res.json({
        success: false,
        message: "Resume file size exceeds allowed size (5MB).",
      });
   }

   // Read and parse PDF
   const dataBuffer = fs.readFileSync(resume.path);
   const pdfData = await pdf(dataBuffer)

   if (!pdfData.text || pdfData.text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded resume appears to be empty or unreadable.",
      });
    }

   //generating prompt
   const prompt = `Review the following resume and provide constructive feedback on its strengths, 
                    weakness and areas for improvement. Resume Content:\n\n${pdfData.text}`;

    
    // Call AI API
    const response = await AI.chat.completions.create({
      model: "gemini-2.0-flash",
      messages: [{
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const content = response?.choices?.[0]?.message?.content

    if (!content) {
      return res.status(500).json({
        success: false,
        message: "AI did not return any content.",
      });
    }

    // Save to DB
    await sql`INSERT INTO creations (user_id, prompt, content, type) 
              VALUES (${userId}, 'Review the uploaded resume', ${content}, 'resume-review')`;

    res.json({success: true, content})
    
  }catch (error) {
    console.error("Resume Review Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};