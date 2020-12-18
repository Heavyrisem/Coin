import React from 'react';
import '../style/Header.css';

class Header extends React.Component {
    render() {
        return (
            <div className="Header">
                <span className="HeaderTitle">Coin ㅇㅇ</span>
                {
                    this.props.userInfo.userID? 
                    <span className="LoginBtn">{this.props.userInfo.userID}</span>:
                    <span className="LoginBtn" onClick={this.props.showLoginPanel}>로그인</span>
                }
            </div>
        )
    }
}


export default Header;
