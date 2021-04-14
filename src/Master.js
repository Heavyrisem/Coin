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
        userCoinBalance: 0,
        userToken: undefined
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

    onLogin(userID, userToken) {
        this.setState({
            userID: userID,
            userToken: userToken
        });
        // cookie
    }

    runBotDetection = function () {
        var documentDetectionKeys = [
            "__webdriver_evaluate",
            "__selenium_evaluate",
            "__webdriver_script_function",
            "__webdriver_script_func",
            "__webdriver_script_fn",
            "__fxdriver_evaluate",
            "__driver_unwrapped",
            "__webdriver_unwrapped",
            "__driver_evaluate",
            "__selenium_unwrapped",
            "__fxdriver_unwrapped",
        ];
    
        var windowDetectionKeys = [
            "_phantom",
            "__nightmare",
            "_selenium",
            "callPhantom",
            "callSelenium",
            "_Selenium_IDE_Recorder",
        ];
    
        for (const windowDetectionKey in windowDetectionKeys) {
            const windowDetectionKeyValue = windowDetectionKeys[windowDetectionKey];
            if (window[windowDetectionKeyValue]) {
                return true;
            }
        };
        for (const documentDetectionKey in documentDetectionKeys) {
            const documentDetectionKeyValue = documentDetectionKeys[documentDetectionKey];
            if (window['document'][documentDetectionKeyValue]) {
                return true;
            }
        };
    
        for (const documentKey in window['document']) {
            if (documentKey.match(/\$[a-z]dc_/) && window['document'][documentKey]['cache_']) {
                return true;
            }
        }
    
        if (window['external'] && window['external'].toString() && (window['external'].toString()['indexOf']('Sequentum') != -1)) return true;
    
        if (window['document']['documentElement']['getAttribute']('selenium')) return true;
        if (window['document']['documentElement']['getAttribute']('webdriver')) return true;
        if (window['document']['documentElement']['getAttribute']('driver')) return true;
        if (navigator.webdriver) return true;
    
        return false;
    };

    async CheckUserStatus() {
        if (this.state.userID == undefined) return;
        console.log("Check")
        let ServerResponse = await fetch(`${serverAddress}/getBalance`, {
            method: "POST",
            body: JSON.stringify({
                Token: this.state.userToken
            }),
            headers: {'Context-type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();
        console.log(ServerResponse)
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
                <Main BotDetection={this.runBotDetection} hideLoginPanel={this.hideLoginPanel.bind(this)} userInfo={this.state} SetBalance={this.SetBalance.bind(this)} CheckUserStatus={this.CheckUserStatus.bind(this)}/>
            </div>
        )
    }
}


export default Master;