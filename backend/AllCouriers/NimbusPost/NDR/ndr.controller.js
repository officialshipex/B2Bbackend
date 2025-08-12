const axios = require('axios');
const { getAuthToken } = require("../Authorize/nimbuspost.controller");

const getNdrDetails = async (req, res) => {
    const { awb_number, per_page = 50, page_no = 1 } = req.query;

    if (!awb_number) {
        return res.status(400).json({ error: 'AWB number is required' });
    }

    const url = 'https://api.nimbuspost.com/v1/ndr';

    try {
        const token = await getAuthToken();
        const params = {
            awb_number,
            per_page,
            page_no,
        };

        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            params,
        });

        if (response.data.status) {
            return res.status(200).json(response.data.data);
        } else {
            return res.status(400).json({ error: 'Error in fetching NDR details', details: response.data });
        }
    } catch (error) {
        console.error('Error in fetching NDR details:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
};


const performNdrActions = async (req, res) => {
    const ndrActions = req.body;

    if (!Array.isArray(ndrActions) || ndrActions.length === 0) {
        return res.status(400).json({ error: 'Invalid input. NDR actions must be a non-empty array.' });
    }

    const url = 'https://api.nimbuspost.com/v1/ndr/action';

    try {
        const token = await getAuthToken();

        const response = await axios.post(url, ndrActions, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (response.data.some((item) => !item.status)) {
            console.warn(
                'Some actions failed:',
                response.data.filter((item) => !item.status)
            );
            return res.status(207).json({ // HTTP 207 for partial success
                message: 'Some actions failed',
                data: response.data,
            });
        }

        return res.status(200).json({ message: 'All actions performed successfully', data: response.data });
    } catch (error) {
        console.error('Error in performing NDR actions:', error.response?.data || error.message);
        return res.status(500).json({ error: 'Internal Server Error', message: error.response?.data?.message || error.message });
    }
};


module.exports = {
    getNdrDetails,performNdrActions
};
