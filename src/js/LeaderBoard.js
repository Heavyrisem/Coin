import React from 'react';
import '../style/LeaderBoard.css';

import Config from '../Config.json';
import unit from './Unitchanger';

class LeaderBoard extends React.Component {

    state = {
        Ranking: undefined,
        CurrentRank: undefined,
        MyBalance: undefined
    }

    componentDidMount() {
        this.GetLeaderBoard();
    }

    componentDidUpdate(prevProps) {
        if (this.props.userID != prevProps.userID) {
            console.log("Get New Leaderboard");
            this.GetLeaderBoard();
        }
    }
    
    async GetLeaderBoard() {
        let ServerResponse = await fetch(`${Config.serverAddress}/ranking`, {
            method: "POST",
            body: (this.props.userID)? JSON.stringify({id: this.props.userID}): undefined,
            headers: {'Content-Type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();
        if (ServerResponse.ranking) {
            this.setState({
                Ranking: ServerResponse.ranking,
                CurrentRank: (ServerResponse.currentRank)? ServerResponse.currentRank : undefined,
                MyBalance: (ServerResponse.balance)? ServerResponse.balance : undefined
            });
        }
    }
    
    render() {
        return (
            <div className="card LeaderBoard">
                <span className="LeaderBoardTitle">리더보드</span>
                {this.state.Ranking&& this.state.Ranking.map((userdata, index) => {
                    if (userdata.name == this.props.userID && index == this.state.CurrentRank-1) {
                        return <div className="Leaders MyScore" key={userdata.name}>{index+1}. <span>{userdata.name}</span> <span className="LeaderBalance"> {unit.Killo(userdata.Balance)}</span></div>
                    } else {
                        return <div className="Leaders" key={userdata.name}>{index+1}. <span>{userdata.name}</span> <span className="LeaderBalance"> {unit.Killo(userdata.Balance)}</span></div>
                    }
                })}
                {(this.state.CurrentRank != undefined)&& (this.state.CurrentRank > 5)&& <span className="Leaders MyScore">{this.state.CurrentRank + ". "}<span> {this.props.userID}</span> <span className="LeaderBalance"> {unit.Killo(this.state.MyBalance)}</span></span>}
            </div>
        )
    }

}

export default LeaderBoard;