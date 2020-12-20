import React from 'react';
import '../style/LeaderBoard.css';

import Config from '../Config.json';

class LeaderBoard extends React.Component {

    state = {
        Ranking: undefined,
        CurrentRank: undefined
    }

    constructor(props) {
        super(props);
        this.GetLeaderBoard()
    }

    async GetLeaderBoard() {
        let ServerResponse = await fetch(`${Config.serverAddress}/ranking`, {
            method: "POST",
            body: (this.props.userID)&& JSON.stringify({id: this.props.userID}),
            headers: {'Content-Type': 'application/json'}
        });
        ServerResponse = await ServerResponse.json();

        if (ServerResponse.ranking) {
            this.setState({
                Ranking: ServerResponse.ranking,
                CurrentRank: (ServerResponse.currentRank)? ServerResponse.currentRank : undefined
            });
        }
    }
    
    render() {
        return (
            <div className="card LeaderBoard">
                순위
                {this.state.Ranking&& this.state.Ranking.map(userdata => {
                    return <div>{userdata.name}</div>
                })}
            </div>
        )
    }

}

export default LeaderBoard;