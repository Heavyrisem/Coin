import React from 'react';
import '../style/Trade.css';

import unit from './Unitchanger';
import {serverAddress} from '../Config.json';

class Trade extends React.Component {

    state = {
        calculatedValue: undefined,
        message: undefined
    }

    constructor() {
        super();
        this.InputValue = {
            value: 0
        }
    }

    stopEventBubble(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    async Buy(e) {
        this.stopEventBubble(e);
        if (this.InputValue.value < 1) return;
        console.log(this.props.userInfo.userID, this.InputValue.value)
        let ServerResponse = await fetch(`${serverAddress}/buy`, {
            method: "POST",
            body: JSON.stringify({
                id: this.props.userInfo.userID,
                Amount: this.InputValue.value,
                Token: this.props.userInfo.userToken
            }),
            headers: {'Content-type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();

        if (ServerResponse.CoinBalance != undefined) {
            this.props.SetBalance(ServerResponse.CoinBalance, ServerResponse.MoneyBalance);
            this.props.Close();
        } else {
            switch(ServerResponse.msg) {
                case "MONEY_NOT_ENOUGH": {
                    this.setState({
                        message: "화폐가 부족합니다."
                    });
                    break;
                }
                case "USER_NOT_FOUNT": {
                    this.setState({
                        message: "알수없는 사용자 입니다."
                    })
                    break;
                }
                default: {
                    this.setState({
                        message: ServerResponse.msg
                    })
                }
            }
        }
    }

    
    async Sell(e) {
        this.stopEventBubble(e);
        if (this.InputValue.value < 1) return;
        
        let ServerResponse = await fetch(`${serverAddress}/sell`, {
            method: "POST",
            body: JSON.stringify({
                id: this.props.userInfo.userID,
                Amount: this.InputValue.value,
                Token: this.props.userInfo.userToken
            }),
            headers: {'Content-type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();

        if (ServerResponse.CoinBalance != undefined) {
            this.props.SetBalance(ServerResponse.CoinBalance, ServerResponse.MoneyBalance);
            this.props.Close();
        } else {
            switch(ServerResponse.msg) {
                case "COIN_NOT_ENOUGH": {
                    this.setState({
                        message: "코인이 부족합니다."
                    });
                    break;
                }
                case "USER_NOT_FOUNT": {
                    this.setState({
                        message: "알수없는 사용자 입니다."
                    })
                    break;
                }
                default: {
                    this.setState({
                        message: ServerResponse.msg
                    })
                }
            }
        }
    }

    FillMaxSell() {
        this.InputValue.value = this.props.userInfo.userCoinBalance;
    }

    FillMaxBuy() {
        // console.log(this.props.CoinValue, this.props.userInfo.userMoneyBalance, parseInt(this.props.userInfo.userMoneyBalance/this.props.CoinValue))
        if (this.props.CoinValue > this.props.userInfo.userMoneyBalance) this.InputValue.value = 0;
        else this.InputValue.value = parseInt(this.props.userInfo.userMoneyBalance/this.props.CoinValue);
    }

    Fee(m) {
return parseInt(m - m * 10 / 100); // 10%수수료
    }

    render() {
        const Sell = (
            <> 
                <span className="Title">판매</span>
                <input className="InputValue" type="number" ref={e=>{this.InputValue = e}} onChange={()=>{this.setState({message: undefined});console.log("close")}} placeholder="판매할 코인의 수를 입력하세요" />
                <span className="CalculatedValue">{this.state.message? this.state.message : this.InputValue.value? unit.Comma(Fee(parseInt(this.InputValue.value) * this.props.CoinValue))+" KRW": "받을 금액 KRW"} </span>
                <div className="TradeBtns">
                    <div className="TradeSubmit" style={{color: 'rgb(146, 146, 146)', backgroundColor: 'rgb(231, 231, 231)'}} onClickCapture={this.FillMaxSell.bind(this)}>전체 입력</div>
                    <div className="TradeSubmit" onClickCapture={this.Sell.bind(this)}>확인</div>
                </div>
            </>
        );
        const Buy = (
            <> 
                <span className="Title">구매</span>
                <input className="InputValue" type="number" ref={e=>{this.InputValue = e}} onChange={()=>{this.setState({message: undefined});console.log("close")}} placeholder="구매할 코인의 수를 입력하세요" />
                <span className="CalculatedValue">{this.state.message? this.state.message : (this.InputValue.value)? unit.Comma(parseInt(this.InputValue.value) * this.props.CoinValue)+" KRW": "지불될 금액 KRW"} </span>
                <div className="TradeBtns">
                    <div className="TradeSubmit" style={{color: 'rgb(146, 146, 146)', backgroundColor: 'rgb(231, 231, 231)'}} onClickCapture={this.FillMaxBuy.bind(this)}>전체 입력</div>
                    <div className="TradeSubmit" onClickCapture={this.Buy.bind(this)}>확인</div>
                </div>
            </>
        );
        const Error = <span>Error</span>;

        return(
            <div className="TradeMenu" onClick={this.stopEventBubble}>
                {
                    (this.props.type == "Sell")? Sell :
                    (this.props.type == "Buy")? Buy :
                    Error
                }
            </div>
        );
    }
}

export default Trade;