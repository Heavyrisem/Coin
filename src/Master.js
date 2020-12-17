import React from 'react';
import './style/Master.css';

import Header from './js/Header';
import Main from './js/Main';
import Login from './js/Login';

class Master extends React.Component {
    state = {
        userID: undefined,
        userCoinValue: 0,
        userMoneyValue: 0
    }

    onLogin(userID) {
        this.setState({
            userID: userID
        });
        // cookie
    }

    SetBalance(Coin, Money) {
        this.setState({
            userCoinValue: Coin,
            userMoneyValue: Money
        });
    }

    render() {
        if (this.state.userID == undefined) {
            return (<Login onSuccess={this.onLogin.bind(this)} SetBalance={this.SetBalance.bind(this)}/>);
        }
        return (
            <div className="Master">
                <Header userInfo={this.state}/>
                <Main userInfo={this.state} SetBalance={this.SetBalance.bind(this)}/>
            </div>
        )
    }
}


export default Master;