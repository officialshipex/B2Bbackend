const transporter = require("./configEmailpass");

const sendWelcomeEmail = async (email, fullname) => {
  const mailOptions = {
    from: '"Shipex Team" <support@shipexindia.com>',
    to: email,
    subject: "Welcome to Shipex - Complete KYC & Unlock Exciting Offers!",
    html: `
   <table cellspacing="0" cellpadding="0" style="margin:0px auto; width: 100%; background-color:#fff;">
    <tbody>
        <tr>
            <td>
                <div
                    style="background-color: #fff; border: 1px solid #eee; box-sizing: border-box; font-family: Lato, Helvetica, 'Helvetica Neue', Arial, 'sans-serif'; margin: auto; max-width: 600px; overflow: hidden; width: 600px;">
                    <div
                        style="padding: 65px 90px 20px; background-color: #1B3E71; background-image: url(https://static.zohocdn.com/zeptomail/assets/images/circles.4ee9fbd3db3cd183c76b.svg); background-repeat: no-repeat; background-position: top right; background-size: 140px;">
                        <h4 style="color: #fff; font-weight: normal; font-size: 16px; margin: 0; margin-bottom: 10px;">
                            Hi ${fullname},<br></h4>
                        <h2 style="color: #fff; font-size: 24px; font-weight: normal;margin: 0;">Welcome to Shipex
                            India!<br></h2>
                    </div>
                    <div style="padding: 25px 90px 65px;">
                        <p style="margin: 0px; line-height: 20px;">
                            <span class="size" style="font-size: 14px; margin: 0px; line-height: 20px;">We're very glad that you have chosen <b>Shipex</b> for your business.</span><br>
                        </p>
                        <div><br></div>
                        
                        <div><br></div>
                        <p style="margin: 0px 0px 30px; line-height: 20px;">
                            <span class="size" style="font-size: 14px; margin: 0px 0px 30px; line-height: 20px;">If you'd like to know more about <b>Shipex India</b> or want to get in touch with us, get in touch with our customer support team.</span><br>
                        </p>
                        <p style="margin: 0px 0px 30px; line-height: 20px;">
                            <span class="size" style="font-size: 14px; margin: 0px 0px 30px; line-height: 20px;">If you're looking for immediate help, take a look at our help documentation and view our latest updates in our blog.</span><br>
                        </p>
                        <p style="margin: 0px; line-height: 20px;">
                            <span class="size" style="font-size: 14px; margin: 0px; line-height: 20px;">Thank you,</span><br>
                        </p>
                        <p style="margin: 0px; line-height: 20px;">
                            <span class="size" style="font-size: 14px; margin: 0px; line-height: 20px;">Team Shipex.</span><br>
                        </p>
                    </div>
                </div>
            </td>
        </tr>
    </tbody>
</table>
<div><br></div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

module.exports = { sendWelcomeEmail };
