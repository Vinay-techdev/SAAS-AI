import multer from "multer";

// const storage = multer.diskStorage({});

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Save to uploads/ folder
  },

  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName); //  Add timestamp to avoid conflicts
  },
});

export const upload = multer({storage})