// const jwt = require('jsonwebtoken');
// const {JWT} = require('../config/index');

// //generate token
// const generateToken = (payload) => {
//     try{
//         const options = {
//             expiresIn:JWT.EXPIRY,
//         }
//         const token = jwt.sign(payload,JWT.SECRET_KEY,options);
//         return token
//     }
//     catch (error){
//         return false;
//     }
// }

// //validate token
// const validateToken = token => {
//     try {
//         const payload = jwt.verify(token,JWT.SECRET_KEY);
//         return {
//             success:true,
//             data:payload
//         };
//     }
//     catch (error){
//         return {
//             success:false,
//             data:error
//         };  
//     }
// }

// module.exports={
//     generateToken,
//     validateToken
// }y