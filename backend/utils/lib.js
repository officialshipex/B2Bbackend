if(process.env.NODE_ENV!="production"){
    require('dotenv').config();
}

const crypto = require('crypto');



function getSignature() {
   
    let clientId = process.env.X_CLIENT_ID;
    
    let publicKey = process.env.PUBLIC_KEY;
   
    let timestamp = Math.floor(Date.now() / 1000);
    
    let dataToEncrypt = `${clientId}.${timestamp}`;
    
    let encryptedSignature = crypto.publicEncrypt(publicKey, Buffer.from(dataToEncrypt));
   
    let signatureBase64 = encryptedSignature.toString('base64');
   
    return signatureBase64;
}




function validateGST(gstNumber) {
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;
    return gstRegex.test(gstNumber);
}

function validatePAN(pan) {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}

function validateAadhaar(aadhaar) {
    const aadhaarRegex = /^[2-9]{1}[0-9]{11}$/;
    return aadhaarRegex.test(aadhaar);
}

function validateAccountNumber(accountNumber) {
    const bankAccountRegex = /^[a-zA-Z0-9]{6,40}$/;
    return bankAccountRegex.test(accountNumber);
}

function validateBankDetails(bank_account, ifsc  ) {
    // console.log(bank_account, ifsc, name, phone);
    // Bank account validation: alphanumeric, 6 to 40 characters
    const bankAccountRegex = /^[a-zA-Z0-9]{6,40}$/;
    if (!bankAccountRegex.test(bank_account)) {
        return { valid: false, message: "Invalid bank account number" };
    }

    // IFSC validation: 11 characters, first 4 alphabets, 5th character 0, last 6 digits
    const ifscRegex = /^[A-Z]{4}0[0-9]{6}$/;
    if (!ifscRegex.test(ifsc)) {
        return { valid: false, message: "Invalid IFSC code" };
    }

    // Name validation: alphanumeric, space, period, hyphen, slash, ampersand
    // const nameRegex = /^[a-zA-Z0-9\s\.\-\/\&]+$/;
    // if (!nameRegex.test(name)) {
    //     return { valid: false, message: "Invalid name format" };
    // }

    // Phone validation: numeric, 8 to 13 digits
    // const phoneRegex = /^[0-9]{8,13}$/;
    // if (!phoneRegex.test(phone)) {
    //     return { valid: false, message: "Invalid phone number" };
    // }
// console.log("all fields are valid");
    return { valid: true, message: "All fields are valid" };
}



module.exports = {
    getSignature,
    validateGST,
    validatePAN,
    validateAadhaar,
    validateBankDetails,
    validateAccountNumber,
};