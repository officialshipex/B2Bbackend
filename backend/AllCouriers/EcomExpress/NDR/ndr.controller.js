const axios = require('axios');
const FormData = require('form-data');

//FORWARD
const submitNDRResolutionsforward= async (req, res) => {
    const {jsonInput } = req.body;

    if (!jsonInput) {
        return res.status(400).json({ error: 'Username, password, and json_input are required.' });
    }

    const url = 'https://clbeta.ecomexpress.in/apiv2/ndr_resolutions/';
    const formData = new FormData();
    formData.append('username', process.env.ECOM_GMAIL);
    formData.append('password', process.env.ECOM_PASS);
    formData.append('json_input', JSON.stringify(jsonInput));

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders(),
        });
        res.status(200).json({ data: response.data });
    } catch (error) {
        if (error.response) {
            res.status(error.response.status || 500).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};

const submitNDRResolutionsRev= async (req, res) => {
    const { json_input } = req.body;

    if (!json_input) {
        return res.status(400).json({ error: 'json_input is required.' });
    }

    const url = 'https://clbeta.ecomexpress.in/apiv2/ndr_resolutions/';
    const formData = new FormData();
    formData.append('username', process.env.ECOM_GMAIL);
    formData.append('password', process.env.ECOM_PASS);
    formData.append('json_input', JSON.stringify(json_input));

    try {
        const response = await axios.post(url, formData, {
            headers: formData.getHeaders(),
        });
        res.status(200).json({ data: response.data });
    } catch (error) {
        if (error.response) {
            res.status(error.response.status || 500).json({ error: error.response.data });
        } else {
            res.status(500).json({ error: error.message });
        }
    }
};


module.exports = { submitNDRResolutionsforward ,submitNDRResolutionsRev};
