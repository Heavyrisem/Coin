import React from 'react';
import logo from '../img/logo.svg';
import '../style/Main.css';
import Chart from 'chart.js';
import unit from './Unitchanger';

import Trade from './Trade';
import CountUp from 'react-countup';
import LeaderBoard from './LeaderBoard';

import io from 'socket.io-client';

import {serverAddress} from '../Config.json';

class Main extends React.Component {
  state = {
    chart: undefined,
    chartoption: {  // set chart options and data
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        labels: ['1'],
        datasets: [{
          display: false,
          label: 'Coin`s Value',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: [201],
          fill: false
        }],
      },

      // Configuration options go here
      options: {
        legend: {
            display: false
        },
        scales: {
          xAxes: [{
              gridLines: {
                  color: "rgba(0, 0, 0, 0)",
              }
          }],
          yAxes: [{
            // gridLines: {
            //     color: "rgba(0, 0, 0, 0)",
            // },
            ticks: {
                stepSize: 200,
                userCallback: (value, index, values) => {
                  // console.log(unit.Killo(value));
                  return unit.Killo(value);
                }
            }
          }]
        },
        tooltips: {
          callbacks: {
            custom: function(tooltip) {
              if (!tooltip) return;
              // disable displaying the color box;
              tooltip.displayColors = false;
            },
            label: (tooltipiItem, data) => {
              let value = data.datasets[tooltipiItem.datasetIndex].data[tooltipiItem.index];
              return unit.Comma(value);
            },
            title: function(tooltipItem, data) {
              return;
            }
          }
        }
      }
    },
    serverSocket: undefined,
    nextChartUpdate: undefined,
    lastCoinValue: 0,
    CoinValueStatus: 0,
    type: undefined,
    showTrade: false,
    wiseSaying: {
        Message: undefined,
        Author: undefined
    }
  }

  componentDidMount() {
    this.connectSocket();
    this.drawChart();
    this.nextUpdateTimer();
    this.GetWiseSaying();
  }

  connectSocket() {

    this.state.serverSocket = io.connect(`${serverAddress}`);
    this.state.serverSocket.on("CoinValue", (data) => {
      this.pushData(data);
      this.setState({
        type: data.type,
        lastCoinValue: data.coinValue
      });
    })

    this.state.serverSocket.on('connect', () => {
      console.log("connected");
    })

  }

  drawChart() {
    let chart = document.getElementById("realtimeValueChart"); // get element

    this.state.chart = new Chart(chart, this.state.chartoption);  // draw chart

    // setInterval(this.pushData.bind(this), 50);
  }

  max(array) {
    let mx = 0;
    for (let i = 0; i < array.length; i++) {
      if (mx < array[i]) mx = array[i];
    }
    return mx;
  }
  min(array) {
    let mi = array[0];
    for (let i = 0; i < array.length; i++) {
      if (mi > array[i]) mi = array[i];
    }
    return mi;
  }

  pushData(data) {
    if (data) {
      // console.log(getStandardDeviation(this.state.chartoption.data.datasets[0].data))

      // 하락율 계산
      this.setState({
        CoinValueStatus: data.coinValue - this.state.chartoption.data.datasets[0].data[this.state.chartoption.data.datasets[0].data.length-1]
      });

      this.state.chartoption.data.datasets[0].data.push(data.coinValue);
      // console.log(parseFloat(data.coinValue).toFixed(5));
      this.state.chartoption.data.labels.push(data.updateTime);
      this.state.nextChartUpdate = parseFloat(data.nextUpdate/1000).toFixed(1);

      if (this.state.chartoption.data.labels.length > 5) {
        this.state.chartoption.data.labels.shift();
        this.state.chartoption.data.datasets[0].data.shift();
      }

    }
    
    let tmp = this.state.chartoption.data.datasets[0].data;
    let mx = this.max(tmp);
    let mi = this.min(tmp);
    tmp = ((mx-mi)/2).toFixed(5);
    // console.log(tmp)

    this.state.chartoption.options.scales.yAxes[0].ticks.stepSize = tmp;
    this.state.chart.update();
  }
  nextUpdateTimer() {
    if (this.state.nextChartUpdate > 0 && this.state.nextChartUpdate) {
      this.setState({
        nextChartUpdate: (this.state.nextChartUpdate-0.1).toFixed(1)
      })
    }
    setTimeout(this.nextUpdateTimer.bind(this), 100);
  }

  getValueStatus() {
    if (this.state.CoinValueStatus > 0) {
      return({
        color: 'red'
      });
    } else {
      return({
        color: 'blue'
      });
    }
  }

  hideEverything() {
    this.props.hideLoginPanel();
    this.setState({
      showTrade: false
    })
  }

  async GetWiseSaying() {
    let ServerResponse = await fetch(`${serverAddress}/getWise`, {
      method: 'POST'
    });
    ServerResponse = await ServerResponse.json();

    if (ServerResponse.Author != undefined) {
      this.setState({
        wiseSaying: {
          Author: ServerResponse.Author,
          Message: ServerResponse.Message
        }
      })
    } else {
      console.log(ServerResponse);
      this.setState({
        wiseSaying: {
          Author: undefined,
          Message: "데이터 요청에 실패하였습니다."
        }
      })
    }
  }

  render() {
    return (
      <div className="Main" onClick={this.hideEverything.bind(this)}>
        {this.state.showTrade&& <Trade userInfo={this.props.userInfo} CoinValue={this.state.lastCoinValue} type={this.state.showTrade} SetBalance={this.props.SetBalance} Close={()=>{this.setState({showTrade: undefined})}} />}

        {/* <div className="doubleCard">
          <div onClickCapture={this.props.showLoginPanel} className="card" style={{textAlign: 'center', backgroundColor: 'rgb(210, 210, 210)'}}>
            {this.props.userInfo.userID? this.props.userInfo.userID:"로그인해 주세요"} 
          </div>
        </div> */}

        <div className="chart card">
          <span className="CoinValue">
            <span className="Value">{<CountUp start={parseInt(this.state.chartoption.data.datasets[0].data[this.state.chartoption.data.datasets[0].data.length-2])} end={parseInt(this.state.lastCoinValue)} formattingFn={unit.Comma}/>}</span>
            <span className="ValueType">KRW </span>
            <span className="ValueStatus" style={this.getValueStatus()}>
            {(this.state.CoinValueStatus > 0 && this.state.CoinValueStatus)&& "+"}{this.state.CoinValueStatus}
            ({(this.state.CoinValueStatus!=0)? (Math.abs(this.state.CoinValueStatus)/this.state.lastCoinValue * 100).toFixed(2)+"%" : "Loading"}) {(this.state.CoinValueStatus > 0)? <i className="fas fa-caret-up"></i>: <i className="fas fa-caret-down"></i>}
            </span>
          </span>
          <div>
            <canvas className="realtimeValueChart" id="realtimeValueChart"></canvas>
          </div>
        </div>

        {(this.props.userInfo.userID!=undefined)&&
          (<><div className="doubleCard">
            <button className="card sell trade" onClickCapture={(e)=>{e.stopPropagation();this.setState({showTrade: "Sell"})}}>
            <i className="fas fa-shopping-cart"></i> 판매
            </button>
            <button className="card buy trade" onClickCapture={(e)=>{e.stopPropagation();this.setState({showTrade: "Buy"})}}>
            <i className="fas fa-cart-plus"></i>  구매
            </button>
          </div>

          <div className="card">
              <span>
                내 코인: {(this.props.userInfo.userCoinBalance!=undefined)? unit.Comma(this.props.userInfo.userCoinBalance)+" JG": "로그인해 주세요"}
              </span>
          </div>          
          <div className="card">
            <span>
              내 화폐: {(this.props.userInfo.userMoneyBalance!=undefined)? unit.Comma(this.props.userInfo.userMoneyBalance)+" KRW": "로그인해 주세요"}
            </span>
          </div></>)
        }

        <LeaderBoard userID={this.props.userInfo.userID} />

        <div className="card">
          <div className="Say">"{this.state.wiseSaying.Message}"</div>
          <div className="Say Who">- {this.state.wiseSaying.Author}</div>
        </div>
        
      </div>
    );
  }
}

export default Main;
