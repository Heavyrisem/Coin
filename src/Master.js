import React from 'react';
import './style/Master.css';

import Header from './js/Header';
import Main from './js/Main';
import Login from './js/Login';

import {serverAddress} from './Config.json';

class Master extends React.Component {
    state = {
        showLoginPanel: false,
        userID: undefined,
        userCoinBalance: 0,
        userCoinBalance: 0
    }

    showLoginPanel(e) {
        e.stopPropagation();
        this.setState({
            showLoginPanel: true
        });
    }
    hideLoginPanel() {
        this.setState({
            showLoginPanel: false
        });
    }

    onLogin(userID) {
        this.setState({
            userID: userID
        });
        // cookie
    }



    async CheckUserStatus() {
        if (this.userID == undefined) return;
        let ServerResponse = await fetch(`${serverAddress}/getBalance`, {
            method: "POST",
            body: JSON.stringify({
                name: this.state.userID
            }),
            headers: {'Context-type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();

        if (ServerResponse.CoinBalance != undefined) this.SetBalance(ServerResponse.CoinBalance, ServerResponse.MoneyBalance);
    }

    SetBalance(Coin, Money) {
        this.setState({
            userCoinBalance: parseInt(Coin),
            userMoneyBalance: parseInt(Money)
        });
    }

    render() {
        return (
            <div className="Master">
                {(this.state.userID==undefined&&this.state.showLoginPanel)&& <Login show={this.showLoginPanel.bind(this)} hide={this.hideLoginPanel.bind()} onSuccess={this.onLogin.bind(this)} SetBalance={this.SetBalance.bind(this)}/>}
                <Header showLoginPanel={this.showLoginPanel.bind(this)} hideLoginPanel={this.hideLoginPanel.bind(this)}  userInfo={this.state}/>
                <Main hideLoginPanel={this.hideLoginPanel.bind(this)} userInfo={this.state} SetBalance={this.SetBalance.bind(this)}/>
            </div>
        )
    }
}


export default Master;