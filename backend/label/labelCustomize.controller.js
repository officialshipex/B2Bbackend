const LabelSettings = require("./labelCustomize.model");
const { s3 } = require("../config/s3");
const { PutObjectCommand } = require("@aws-sdk/client-s3");

const getLabelSettings = async (req, res) => {
  const userId = req.user.id; // assuming middleware sets `req.user`

  try {
    let settings = await LabelSettings.findOne({ userId });

    if (!settings) {
      // Return default settings if none found
      settings = new LabelSettings({ userId });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch label settings", error });
  }
};

const saveLabelSettings = async (req, res) => {
  const userId = req.user.id;
  const data = req.body;

  try {
    let settings = await LabelSettings.findOneAndUpdate(
      { userId },
      { ...data, userId },
      { new: true, upsert: true } // create if not exists
    );

    res.json({ message: "Settings saved successfully", settings });
  } catch (error) {
    res.status(500).json({ message: "Failed to save label settings", error });
  }
};

const uploadLabelLogo = async (req, res) => {
    const file = req.file;
    const userId = req.user.id;
  
    if (!file) return res.status(400).json({ message: "No file uploaded" });
  
    const key = `label-logos/${userId}-${Date.now()}.${file.originalname.split(".").pop()}`;
  
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      
    };
  
    try {
      await s3.send(new PutObjectCommand(params));
      const logoUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
      res.status(200).json({ logoUrl });
    } catch (err) {
      console.error("S3 Upload Error", err);
      res.status(500).json({ message: "S3 upload failed", error: err });
    }
  };
  

module.exports = { getLabelSettings, saveLabelSettings, uploadLabelLogo };
