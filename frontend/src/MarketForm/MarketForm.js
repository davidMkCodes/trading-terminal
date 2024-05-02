import React, {useState, useEffect} from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import './MarketForm.css'

function MarketForm() {
    const [amount, setAmount] = useState(''); // State to manage the amount
    const [limit, setLimit] = useState('70000');
    const [btcBalance, setBTCBalance] = useState('');
    const [usdcBalance, setUSDCBalance] = useState('');
    const [btcUUID, setBTCUUID] = useState('');
    const [usdcUUID, setUSDCUUID] = useState('');
    const [orderSide, setOrderSide] = useState('BUY');
    const [orderType, setOrderType] = useState('market');
    const [openOrders, setOpenOrders] = useState([]);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:8000/accounts');
            if (response.ok) {
                const data = await response.json();
                const btcAccount = data.message.accounts.find(account => account.currency === 'BTC');
                const usdcAccount = data.message.accounts.find(account => account.currency === 'USDC');
                if (btcAccount) {
                    setBTCBalance(btcAccount.available_balance.value);
                    setBTCUUID(btcAccount.uuid);
                }
                if (usdcAccount) {
                    setUSDCBalance(usdcAccount.available_balance.value);
                    setUSDCUUID(usdcAccount.uuid);
                }
            } else {
                console.error('Failed to fetch accounts:', response.statusText);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const fetchOpenOrders = async () => {
        try {
            const response = await fetch(`http://localhost:8000/open-orders`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const ordersData = await response.json();
                setOpenOrders(ordersData.message.orders.slice(0, 50))
            } else {
                console.error('Failed to retrieve orders history:', response.statusText);
            }

        } catch (error) {
            console.error('Error occurred while retrieving order history:', error);
        }
    }

    const refreshLimitPrice = async () => {
        const price = await getPairPrice("BTC-USD");
        setLimit(price)
    };

    useEffect(async () => {
        const fetchAccountData = async () => {
            await fetchAccounts();
        };
        const fetchOpenOrdersData = async () => {
            await fetchOpenOrders();
        };
        const fetchLimitPrice = async () => {
            await refreshLimitPrice();
        };
        await fetchOpenOrdersData();
        await fetchAccountData();
        await fetchLimitPrice()

    }, []);

    const handlePurchase = async () => {
        try {
            const response = await fetch('http://localhost:8000/purchase', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order_type: orderType,
                    side: orderSide,
                    amount: amount,
                    ...(orderType === 'limit' ? { limit_price: limit } : {})
                })
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Purchase successful:', data);
                await refreshBalances()
                await fetchOpenOrders()
            } else {
                console.error('Purchase failed:', response.statusText);
            }
        } catch (error) {
            console.error('Error occurred during purchase:', error);
        }
    };

    const cancelOrder = async (order) => {
        try {
            console.log("TEST0")
            const response = await fetch('http://localhost:8000/cancel-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    order: order
                })
            });
            console.log("TEST1")
            console.log(response)
            console.log("TEST2")
            if (response.ok) {
                const data = await response.json();
                console.log('Cancel order successful:', data);
                await fetchOpenOrders()
                await refreshBalances()
            } else {
                console.error('Cancel order failed:', response.statusText);
            }
            console.log("TEST3")
        } catch (error) {
            console.error('Error occurred during purchase:', error);
        }
    };

    const refreshBalances = async () => {
        try {
            const btcResponse = await fetch(`http://localhost:8000/balance/${btcUUID}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (btcResponse.ok) {
                const btcData = await btcResponse.json();
                console.log(btcData.message.account.available_balance.value)
                setBTCBalance(btcData.message.account.available_balance.value)
            } else {
                console.error('Failed to retrieve BTC balance:', btcResponse.statusText);
            }
        } catch (error) {
            console.error('Error occurred while retrieving BTC balance:', error);
        }

        try {
            const usdcResponse = await fetch(`http://localhost:8000/balance/${usdcUUID}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            if (usdcResponse.ok) {
                const usdcData = await usdcResponse.json();
                console.log(usdcData.message.account.available_balance.value)
                setUSDCBalance(usdcData.message.account.available_balance.value); // Update USDC balance state
            } else {
                console.error('Failed to retrieve USDC balance:', usdcResponse.statusText);
            }
        } catch (error) {
            console.error('Error occurred while retrieving USDC balance:', error);
        }
    };

    const handleToggleOrderType = (type) => {
        setOrderType(type);
    };

    const handleToggleOrderSide = async (side) => {
        setOrderSide(side);
        setAmount(0)
    };

    const handleAmountChange = (event) => {
        setAmount(event.target.value); // Update the amount state when the input value changes
    };

    const handleLimitChange = (event) => {
        setLimit(event.target.value); // Update the amount state when the input value changes
    };

    const handleMaxClick = async () => {
        if(orderType === 'limit' && orderSide === 'BUY'){
            const price = await getPairPrice("BTC-USD");

            const quoteSize = (Math.floor(parseFloat(usdcBalance) * 100) / 100).toFixed(2)
            const convertedBalance = (Math.floor(parseFloat(quoteSize / price) * 1e8) / 1e8).toFixed(8);
            setAmount((Math.floor(parseFloat(convertedBalance) * 1e8) / 1e8).toFixed(8));
        }
        else if (orderSide === 'BUY') {
            setAmount((Math.floor(parseFloat(usdcBalance) * 100) / 100).toFixed(2));
        } else {
            setAmount((Math.floor(parseFloat(btcBalance) * 1e8) / 1e8).toFixed(8));
        }

    };

    const getPairPrice = async (pair) => {
        try {
            const response = await fetch(`http://localhost:8000/product/${pair}`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const pairData = await response.json();
                return pairData.message.price
            } else {
                console.error('Failed to retrieve pair info:', response.statusText);
            }

        } catch (error) {
            console.error('Error occurred while retrieving pair info:', error);
        }
    };

    const convertToRegularDateAndPST = (timestamp) => {
        const date = new Date(timestamp);
        const regularDate = date.toLocaleDateString();
        const pstTime = date.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });
        return { regularDate, pstTime };
    };

    return (
        <Form>
            <div>
                <div className="order-form-container" style={{ marginBottom: '10px' }}>
                    <div className="btn-group">
                        <Button className={`btn btn-primary btn-lg ${orderType === 'market' ? 'active' : ''}`} onClick={() => handleToggleOrderType("market")}>Market</Button>
                        <Button className={`btn btn-primary btn-lg ${orderType === 'limit' ? 'active' : ''}`} onClick={() => handleToggleOrderType("limit")}>Limit</Button>
                    </div>
                </div>
                <div className="order-form-container" style={{ marginBottom: '10px' }}>
                    <div className="btn-group">
                        <Button className={`btn btn-success btn-lg buy-button ${orderSide === 'BUY' ? 'active' : ''}`} onClick={() => handleToggleOrderSide("BUY")}>Buy</Button>
                        <Button className={`btn btn-danger btn-lg ${orderSide === 'SELL' ? 'active' : ''}`} onClick={() => handleToggleOrderSide("SELL")}>Sell</Button>
                    </div>
                </div>
            </div>
            <Form.Group className="mb-3" controlId="formBasicEmail">
                {orderType === 'limit' && (
                    <div>
                        <Form.Label>Limit Price (USD)</Form.Label>
                        <Form.Control type="text" placeholder="70,000" value={limit} onChange={handleLimitChange} style={{ marginBottom: '10px' }}/>
                        <Button variant="primary" onClick={refreshLimitPrice} style={{ marginBottom: '10px' }}>
                            Current
                        </Button>
                    </div>
                )}

                {(orderType === 'market' && orderSide === 'BUY') ? (
                    <Form.Label>Amount (USD)</Form.Label>
                ) : (
                    <Form.Label>Amount (BTC)</Form.Label>
                )}
                <Form.Control type="text" placeholder="0.00" value={amount} onChange={handleAmountChange} style={{ marginBottom: '10px' }}/>
                <div>
                    <Button variant="primary" onClick={handleMaxClick} style={{ marginBottom: '10px' }}>Max</Button>
                </div>
                <Form.Text className="text-muted">
                    {orderSide === 'SELL' && (
                        <div>
                            <strong>BTC:</strong> {(Math.floor(parseFloat(btcBalance) * 1e8) / 1e8).toFixed(8)}
                        </div>
                    )}
                    {orderSide === 'BUY' && (
                        <div>
                            <strong>USDC:</strong> {(Math.floor(parseFloat(usdcBalance) * 100) / 100).toFixed(2)}
                        </div>
                    )}

                </Form.Text>

            </Form.Group>
            <Button variant="primary" onClick={handlePurchase}>
                Submit Order
            </Button>
            <br/>
            <div className="open-orders-container">
                <div className="open-orders-sub-container">
                    <h3 className="open-orders-title">Open Orders</h3>
                    <Button className="btn btn-primary btn-lg" onClick={fetchOpenOrders}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                        </svg>
                    </Button>
                </div>

                <div className="open-orders-table-container">
                    <table className="open-orders-table">
                        <thead>
                        <tr>
                            <th className="cell">Date</th>
                            <th className="cell">Product ID</th>
                            <th className="cell">Price</th>
                            <th className="cell">Side</th>
                            <th className="cell">Size</th>
                            <th className="cell">Cancel</th>
                        </tr>
                        </thead>
                        <tbody>
                        {openOrders.slice(0, 50).map((order, index) => (
                            <tr key={index}>
                                <td className="cell">{convertToRegularDateAndPST(order.created_time).regularDate} {convertToRegularDateAndPST(order.created_time).pstTime}</td>
                                <td className="cell">{order.product_id}</td>
                                <td className="cell">{order.order_configuration.limit_limit_gtc.limit_price}</td>
                                <td className="cell">{order.side}</td>
                                <td className="cell">{order.order_configuration.limit_limit_gtc.base_size}</td>
                                <td className="cell">
                                    <Button variant="danger" onClick={()=>cancelOrder(order.order_id)}>
                                        Cancel
                                    </Button>
                                </td>

                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Form>
    );
}

export default MarketForm;

