import React from 'react';
import TradingViewWidget from "../TradingViewWidget/TradingViewWidget";
import MarketForm from "../MarketForm/MarketForm";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css'
import OrderHistory from "../OrderHistory/OrderHistory";

function App() {
    return (
        <>
            <div style={{ display: 'flex', height: '100vh' }}>
                <div className="left-panel">
                    <TradingViewWidget />
                </div>
                <div className='right-panel'>
                    <MarketForm />
                </div>
            </div>
            <div>
                <OrderHistory/>
            </div>
        </>
    );
}

export default App;
