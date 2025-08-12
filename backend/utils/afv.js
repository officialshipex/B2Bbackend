function validateForm(data) {
    const errors = {};

    if(!validateEmail(data.email)){
        errors.email = "Invalid email format.";
    }

    const phoneRegex = /^[0-9]{10}$/;  
    if (!phoneRegex.test(data.phoneNumber)) {
        errors.phoneNumber = "Invalid phone number format.";
    }

    if (data.company && data.company.length < 2) {
        errors.company = "Company name must be at least 2 characters.";
    }

    if (data.password && data.password.length < 8) {
        errors.password = "Password must be at least 8 characters.";
    }

    if ((data.confirmedPassword !== data.password)) {
        errors.confirmedPassword = "Passwords do not match.";
    }

    if(!data.checked){
        errors.checked = "Please agree to the terms and conditions";
    }

    return errors;
}

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
} 

module.exports = {
    validateForm,
    validateEmail
};