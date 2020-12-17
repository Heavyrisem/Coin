import React from 'react';
import '../style/Login.css';

class Login extends React.Component {
    state = {
        ServerResponse: undefined,
        register: false
    }

    async requestLogin() {
        let ServerResponse = await fetch("http://192.168.1.71:3002/login", {
            method: "POST",
            body: JSON.stringify({
                    id: this.id.value,
                    passwd: this.passwd.value
                }),
            headers: {
                    'content-type': 'application/json'
            }
        });
        
        ServerResponse = await ServerResponse.json();
        
        if (ServerResponse.id) {
            this.props.onSuccess(ServerResponse.id);
            this.props.SetBalance(ServerResponse.CoinBalance, ServerResponse.MoneyBalance);
        }
        else
            this.setState({
                ServerResponse: ServerResponse.msg
            })
            // alert("로그인에 실패하였습니다");
    }

    async requestRegister() {
        if (!this.id.value || !this.passwd.value) return this.setState({ServerResponse: "아이디와 비밀번호는 공백일 수 없습니다."});
        let ServerResponse = await fetch("http://192.168.1.71:3002/register", {
            method: "POST",
            body: JSON.stringify({
                id: this.id.value,
                passwd: this.passwd.value
            }),
            headers: {
                'Content-type': 'application/json'
            }
        });
        ServerResponse = await ServerResponse.json();

        if (ServerResponse.id) {
            this.requestLogin();
        } else {
            this.setState({
                ServerResponse: ServerResponse.msg
            });
        }
    }

    render() {
        const Id = (
            <span onClickCapture={e=>{e.stopPropagation();this.setState({register: true, ServerResponse: undefined})}}>
                존재하지 않는 사용자 입니다. 여기를 클릭하여 생성하세요
            </span>
        );
        const Passwd = (
            <span>
                비밀번호가 틀립니다.
            </span>
        );
        const UserExists = (
            <span>
                이미 존재하는 사용자 입니다.
            </span>
        )

        if (this.state.register) {
            return(
                <div className="Login">
                    <span className="LoginTitle">계정 생성</span>
                    <input type="text" className="LoginInputValue" ref={(e) => this.id = e} placeholder="ID" />
                    <input type="password" className="LoginInputValue" ref={(e) => this.passwd = e} placeholder="PW" />
                    <span className="ServerResponse">{
                        (this.state.ServerResponse)&&
                        (this.state.ServerResponse == "USER_EXISTS")? UserExists :
                        this.state.ServerResponse
                    }</span>
                    <div className="LoginSubmit" onClick={this.requestRegister.bind(this)}>계정 생성</div>
                </div>
            )
        } else {
            return(
                <div className="Login">
                    <span className="LoginTitle">로그인</span>
                    <input type="text" className="LoginInputValue" ref={(e) => this.id = e} placeholder="ID" />
                    <input type="password" className="LoginInputValue" ref={(e) => this.passwd = e} placeholder="PW" />
                    <span className="ServerResponse">{
                        (this.state.ServerResponse)&&
                        (this.state.ServerResponse == "NO_USER")? Id :
                        (this.state.ServerResponse == "WRONG_PASSWD")? Passwd :
                        this.state.ServerResponse
                    }</span>
                    <div className="LoginSubmit" onClick={this.requestLogin.bind(this)}>로그인</div>
                </div>
            )
        }
    }


}


export default Login;