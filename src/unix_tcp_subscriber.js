'use strict';
const net = require('net');
const fs = require('fs');
const execSync = require('child_process').execSync;
const debug_ = true;
const SOCK_PATH = '/tmp/dht.pubsub.sock';

class Subscriber {
  constructor() {
    if(debug_) {
    }
    this.tcpReadBuffer_ = '';
    this.client_ = net.createConnection(SOCK_PATH);
    const self = this;
    this.client_.on('connect', () => {
      console.log('Subscriber::constructor: connected!!');
      //console.log('Subscriber::publish: this.client_ =<',this.client_,'>');
      this.client_.ready = true;
    });
    this.client_.on('end', () => {
      console.log('Subscriber::constructor: ended!!');
    });
    this.client_.on('data', (data) => {
      //console.log('Subscriber::constructor: data.toString() =<',data.toString(),'>');
      self.onTCPData_(data.toString(),);
    });
    this.client_.on('error', (err) => {
      console.log('Subscriber::constructor: err =<',err,'>');
    });
  }
  subscribe(channel) {
    console.log('Subscriber::subscribe: channel =<',channel,'>');
    const apiPack = {rq:'subscribe',ch:channel};
    const writePack = JSON.stringify(apiPack);
    const writeB64 = Buffer.from(writePack).toString('base64');
    this.client_.write(writeB64 + '\r\n');
  }
  unsubscribe(channel) {
    console.log('Subscriber::unsubscribe: channel =<',channel,'>');
    const apiPack = {rq:'unsubscribe',ch:channel};
    const writePack = JSON.stringify(apiPack);
    const writeB64 = Buffer.from(writePack).toString('base64');
    this.client_.write(writeB64 + '\r\n');
  }
  onTCPData_(data) {
    if(this.tcpReadBuffer_) {
      data = this.tcpReadBuffer_ + data;
    }
    const dataOflines = data.split('\r\n');
    //console.log('Subscriber::onTCPData_: dataOflines =<',dataOflines,'>');
    this.tcpReadBuffer_ = dataOflines[dataOflines.length - 1];
    for(let index = 0;index < dataOflines.length - 1 ;index++) {
      this.onSegmentData_(dataOflines[index]);
    }
  }
  onSegmentData_(data) {
    const dataText = Buffer.from(data,'base64').toString('utf-8');
    //console.log('Subscriber::onSegmentData_: dataText =<',dataText,'>');
    try {
      const jMsg = JSON.parse(dataText);
      if(jMsg.rq) {
        if(jMsg.rq === 'publish') {
          this.onPublishData_(jMsg);
        } else if(jMsg.rq === 'subscribe') {
        } else if(jMsg.rq === 'unsubscribe') {
        } else {
          console.log('Subscriber::onSegmentData_: jMsg =<',jMsg,'>');
        }
        
      } else {
        console.log('Subscriber::onSegmentData_: jMsg =<',jMsg,'>');
      }
    } catch(err) {
      console.log('Subscriber::onSegmentData_: err =<',err,'>');
    }
  }
  onPublishData_(jMsg) {
    const channel = jMsg.ch;
    const message = jMsg.py;
    console.log('Subscriber::onPublishData_: channel =<',channel,'>');
    console.log('Subscriber::onPublishData_: message =<',message,'>');
  }

};
module.exports = Subscriber;
