import React from 'react';
import logo from '../img/logo.svg';
import '../style/Main.css';
import Chart from 'chart.js';

import io from 'socket.io-client';
const socket = io.connect("http://192.168.1.71:3002");

class Main extends React.Component {
  state = {
    chart: undefined,
    chartoption: undefined,
    serverSocket: undefined
  }

  componentDidMount() {
    this.connectSocket();
    this.drawChart();
  }

  connectSocket() {

    socket.on("CoinValue", (data) => {
      console.log(data);
      this.pushData(data);
    })

    socket.on('connect', () => {
      console.log("connected");
    })

  }

  drawChart() {
    let chart = document.getElementById("realtimeValueChart"); // get element
    this.state.chartoption = {  // set chart options and data
      // The type of chart we want to create
      type: 'line',

      // The data for our dataset
      data: {
        labels: ['1'],
        datasets: [{
          label: 'Coin`s Value',
          backgroundColor: 'rgb(255, 99, 132)',
          borderColor: 'rgb(255, 99, 132)',
          data: [201],
          fill: false
        }],
      },

      // Configuration options go here
      options: {}
    }

    this.state.chart = new Chart(chart, this.state.chartoption);  // draw chart

    // setInterval(this.pushData.bind(this), 50);
  }

  pushData(num) {
    if (num) {
      
      this.state.chartoption.data.datasets[0].data.push(num);
      this.state.chartoption.data.labels.push(num);

      if (this.state.chartoption.data.labels.length > 10) {
        this.state.chartoption.data.labels.shift();
        this.state.chartoption.data.datasets[0].data.shift();
      }

    }
    this.state.chart.update();
  }

  RandomData(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  render() {
    return (
      <div className="Main">
        <canvas id="realtimeValueChart"></canvas>
      </div>
    );
  }
}

export default Main;
