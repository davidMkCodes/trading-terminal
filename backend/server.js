const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');
const { generateToken } = require('./jwt_generator')

let nanoid;

import('nanoid').then(module => {
    nanoid = module.nanoid;
}).catch(error => {
    console.error('Error loading nanoid:', error);
});

require('dotenv').config()

const apiKey = process.env.API_KEY;
const apiSecret = process.env.API_SECRET;

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    console.log('Home');
    res.send('Welcome to the home page');
});

app.post('/purchase', async (req, res) => {
    const orderType = req.body.order_type;
    const side = req.body.side;
    const amount = req.body.amount;
    const limitPrice = req.body.limit_price;

    console.log('Purchase request received:', req.body);

    const token = generateToken(apiKey, apiSecret, "post", "/api/v3/brokerage/orders")
    const randomString = nanoid(16);

    let orderConfig;
    if(orderType === 'market')
        orderConfig = {
            "market_market_ioc": {
                [side === 'BUY' ? 'quote_size' : 'base_size']: amount
            }
        }
    else
        orderConfig = {
            "limit_limit_gtc": {
                "base_size": amount,
                "limit_price": limitPrice
            }
        }
    try {
        console.log(orderConfig)
        let data = JSON.stringify({
            "client_order_id": randomString,
            "product_id": "BTC-USDC",
            "side": side,
            "order_configuration": orderConfig
        });

        let config = {
            method: 'post',
            url: 'https://api.coinbase.com/api/v3/brokerage/orders',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        };

        const response = await axios(config)
            .catch((error) => {
                console.log('error');
            });

        console.log('API Response:', response.data);

        res.json({ success: true, message: response.data });
    } catch (error) {
        console.log('Error')
        // console.error('Error:', error.message);
        res.status(500).json({ success: false, message: 'Error occurred during purchase' });
    }
});

app.get('/accounts', async (req, res) => {
    try {
        const token = generateToken(apiKey, apiSecret, "get", "/api/v3/brokerage/accounts");
        const config = {
            method: 'get',
            url: 'https://api.coinbase.com/api/v3/brokerage/accounts',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await axios(config);
        console.log('API Response:', response.data);
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
});

app.get(`/balance/:uuid`, async (req, res) => {
    try {
        const uuid = req.params.uuid
        console.log('UUID: ' + uuid)
        const token = generateToken(apiKey, apiSecret, "get", `/api/v3/brokerage/accounts/${uuid}`);
        const config = {
            method: 'get',
            url: `https://api.coinbase.com/api/v3/brokerage/accounts/${uuid}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await axios(config);
        console.log('API Response:', response.data);
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
});

app.get(`/product/:pair`, async (req, res) => {
    try {
        const product_id = req.params.pair
        const token = generateToken(apiKey, apiSecret, "get", `/api/v3/brokerage/products/${product_id}`);
        const config = {
            method: 'get',
            url: `https://api.coinbase.com/api/v3/brokerage/products/${product_id}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };

        const response = await axios(config);
        console.log('API Response:', response.data);
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error fetching account:', error);
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
});

app.get('/orders', async (req, res) => {
    try {
        const token = generateToken(apiKey, apiSecret, "get", "/api/v3/brokerage/orders/historical/fills");
        const config = {
            method: 'get',
            url: 'https://api.coinbase.com/api/v3/brokerage/orders/historical/fills',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        const response = await axios(config);
        //console.log('API Response:', response.data);
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
});

app.get('/open-orders', async (req, res) => {
    try {
        console.log("HELLO")
        const token = generateToken(apiKey, apiSecret, "get", "/api/v3/brokerage/orders/historical/batch");
        const config = {
            method: 'get',
            url: 'https://api.coinbase.com/api/v3/brokerage/orders/historical/batch?order_status=OPEN',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        const response = await axios(config);
        //console.log('API Response:', response.data);
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error fetching accounts:', error);
        res.status(500).json({ success: false, message: 'Error fetching accounts' });
    }
});

app.post('/cancel-order', async (req, res) => {
    const order = req.body.order
    console.log(order)
    const token = generateToken(apiKey, apiSecret, "POST", "/api/v3/brokerage/orders/batch_cancel");
    try {
        let data = JSON.stringify({
            "order_ids": [
                order
            ]
        });
        console.log(data)
        let config = {
            method: 'POST',
            url: 'https://api.coinbase.com/api/v3/brokerage/orders/batch_cancel',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            data: data
        }

        const response = await axios(config)
        res.json({ success: true, message: response.data });
    } catch (error) {
        console.error('Error canceling order:', error);
        res.status(500).json({ success: false, message: 'Error canceling account' });
    }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
