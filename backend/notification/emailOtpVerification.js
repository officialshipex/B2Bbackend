const transporter = require("./configEmailpass");
const express = require("express");
const OTPs = {}; // Store OTPs temporarily
const emailOtpRouter = express.Router();
emailOtpRouter.post("/send-email-otp", async (req, res) => {
    const { email } = req.body;
  console.log("kkkk",email)
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
  
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    OTPs[email] = otp; // Store OTP temporarily
  console.log("9999",otp)
    // Email Content
    const mailOptions = {
      from: '"Shipex Team" <support@shipexindia.com>',
      to: email,
      subject: "Your OTP Code",
      html: `<table cellspacing="0" cellpadding="0" style="background-color: #F4F6F7; border: 1px solid #eee; width: 100%;">
    <tbody>
        <tr>
            <td>
                <div
                    style="background-color: #fff; border: 1px solid #DEE6E9; border-radius: 10px; box-sizing: border-box; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, 'sans-serif'; margin: auto; max-width: 600px; overflow: hidden; width: 600px;">

                    <div
                        style="background-color: #25586B; padding: 40px; text-align: center; background-image: url(../images/sampleTemplates/otp.svg); background-repeat: no-repeat; background-position: calc( 100% - 20px ) 20px; background-size: 50px;">
                        <h2 style="color: #3F2955; margin: 0px;">
                            <span class="size" style="font-size: 32px"><i>Shipex India</i></span><br></h2>
                    </div>
                    <div
                        style="padding: 40px 50px; background-image: url(../images/sampleTemplates/shadow.svg); background-repeat: no-repeat; background-position: top; background-size: contain;">
                        <p style="font-size: 14px; margin: 0; margin-bottom: 25px;">Hi </p>
                        <p style="font-size: 16px; margin: 0; margin-bottom: 35px; line-height: 22px;">
                            Verify you email address. Below is your
                            <strong>One time password:</strong>
                        </p>
                        <div style="text-align: center;">
                            <div
                                style="background-color: #25586B0D; border-radius: 6px; color: #25586B; display: inline-block; font-size: 30px; padding: 20px 30px;">
                                ${otp}
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; justify-content: center; margin-top: 15px;">
                            <div
                                style="background-image: url(../images/sampleTemplates/copy.svg); background-repeat: no-repeat; background-size: contain; height: 14px; width: 14px;">
                            </div>
                        </div>
                        <p style="font-size: 14px; margin: 0; margin: 35px 0;  line-height: 22px;">If you didn't request
                            this one time password, ignore the email.</p>
                        <p style="font-size: 14px; margin: 0; margin-bottom: 35px; line-height: 22px;">If you'd like to
                            know more about Shipex or want to get in touch with us, get in touch with our
                            customer support team.</p>
                        <p style="font-size: 14px; margin: 0; line-height: 22px;">Thank you,</p>
                        <p style="font-size: 14px; margin: 0; line-height: 22px;">Team Shipex</p>
                    </div>
                </div>
            </td>
        </tr>
    </tbody>
</table>`,
    };
  
    try {
    const mails=  await transporter.sendMail(mailOptions);
      console.log("hhhhhh",mails)
      res.json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ success: false, message: "Failed to send OTP" });
    }
  });


  emailOtpRouter.post("/verify-email-otp", (req, res) => {
    const { email, otp } = req.body;
  
    if (!OTPs[email] || OTPs[email] != otp) {
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }
  
    delete OTPs[email]; // Remove OTP after verification
    res.json({ success: true, message: "Email verified successfully" });
  })

  module.exports = emailOtpRouter