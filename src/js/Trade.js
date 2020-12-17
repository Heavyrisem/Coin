import React from 'react';
import '../style/Trade.css';

import unit from './Unitchanger';

class Trade extends React.Component {

    state = {
        calculatedValue: undefined
    }

    stopEventBubble(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    

    render() {
        const Sell = (
            <> 
                <span className="Title">판매</span>
                <input className="InputValue" type="number" ref={e=>{this.InputValue = e}} placeholder="판매할 코인의 수를 입력하세요" />
                <span className="CalculatedValue">{this.InputValue? unit.Comma(this.InputValue.value * this.props.CoinValue): "받을 금액"} KRW</span>
                <div className="TradeSubmit">
                    확인
                </div>
            </>
        );
        const Buy = (
            <> 
                <span className="Title">구매</span>
                <input className="InputValue" type="number" ref={e=>{this.InputValue = e}} placeholder="구매할 코인의 수를 입력하세요" />
                <span className="CalculatedValue">{(this.InputValue)? unit.Comma(this.InputValue.value * this.props.CoinValue): "지불될 금액"} KRW</span>
                <div className="TradeSubmit">
                    확인
                </div>
            </>
        );
        const Error = <span>Error</span>;

        return(
            <div className="TradeMenu" onClickCapture={this.stopEventBubble}>
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