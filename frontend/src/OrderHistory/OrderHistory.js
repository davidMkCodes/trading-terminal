import React, { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import './OrderHistory.css'

function OrderHistory() {
    const [orderHistory, setOrderHistory] = useState([]);

    const fetchOrderData = async () => {
        try {
            const response = await fetch(`http://localhost:8000/orders`, {
                method: 'get',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const ordersData = await response.json();
                setOrderHistory(ordersData.message.fills.slice(0, 50))
                console.log(orderHistory)
            } else {
                console.error('Failed to retrieve orders history:', response.statusText);
            }

        } catch (error) {
            console.error('Error occurred while retrieving order history:', error);
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            await fetchOrderData();
        };
        fetchData();
    }, []);


    const refreshOrderHistory = async () => {
        try {
            await fetchOrderData();
        } catch (error) {
            console.error('Error occurred while refetching order history:', error);
        }
    };
    const convertToRegularDateAndPST = (timestamp) => {
        const date = new Date(timestamp);
        const regularDate = date.toLocaleDateString();
        const pstTime = date.toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles' });
        return { regularDate, pstTime };
    };

    return (
        <div className="order-history-container">
            <div className="order-history-sub-container">
                <h1 className="order-history-title">Order History</h1>
                <Button className="btn btn-primary btn-lg" onClick={refreshOrderHistory}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-clockwise" viewBox="0 0 16 16">
                        <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2z"/>
                        <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466"/>
                    </svg>
                </Button>
            </div>
            <hr/>
            <div className="order-history-table-container">
                <table className="order-history-table">
                    <thead>
                    <tr>
                        <th className="cell">Date</th>
                        <th className="cell">Product ID</th>
                        <th className="cell">Price</th>
                        <th className="cell">Side</th>
                        <th className="cell">Size</th>
                        <th className="cell">Trade Type</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orderHistory.slice(0, 50).map((order, index) => (
                        <tr key={index}>
                            <td className="cell">{convertToRegularDateAndPST(order.trade_time).regularDate} {convertToRegularDateAndPST(order.trade_time).pstTime}</td>
                            <td className="cell">{order.product_id}</td>
                            <td className="cell">{order.price}</td>
                            <td className="cell">{order.side}</td>
                            <td className="cell">{order.size}</td>
                            <td className="cell">{order.trade_type}</td>

                        </tr>
                    ))}
                        <hr/>
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default OrderHistory;