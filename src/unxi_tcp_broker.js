'use strict';
const net = require('net');
const fs = require('fs');
const execSync = require('child_process').execSync;
const debug_ = true;
const SOCK_PATH = '/tmp/dht.pubsub.sock';
class UnxiTCPBroker {
  constructor() {
    this.tcpReadBuffer_ = '';
    const resultRM = execSync(`rm -rf ${SOCK_PATH}`);
    if(debug_) {
      console.log('UnxiTCPBroker::constructor: resultRM =<',resultRM.toString(),'>');
    }
    const self = this;
    this.server_ = net.createServer((connection) => {
      connection.on('data', (data) => {
        self.onTCPData_(data.toString(),connection);
      });
    });
    this.server_.listen(SOCK_PATH);
  }
  onTCPData_(data,connection) {
    //console.log('UnxiTCPBroker::onTCPData_: data =<',data,'>');
    if(this.tcpReadBuffer_) {
      data = this.tcpReadBuffer_ + data;
    }
    const dataOflines = data.split('\r\n');
    //console.log('UnxiTCPBroker::onTCPData_: dataOflines =<',dataOflines,'>');
    this.tcpReadBuffer_ = dataOflines[dataOflines.length - 1];
    for(let index = 0;index < dataOflines.length - 1 ;index++) {
      this.onSegmentData_(dataOflines[index],connection);
    }
  }
  onSegmentData_(data,connection) {
    //console.log('UnxiTCPBroker::onSegmentData_: data =<',data,'>');
    const dataText = Buffer.from(data,'base64').toString('utf-8');
    //console.log('UnxiTCPBroker::onSegmentData_: dataText =<',dataText,'>');
    try {
      const jMsg = JSON.parse(dataText);
      if(jMsg.r) {
        if(jMsg.r === 'publish') {
          this.onPublishData_(jMsg,connection);
        } else if(jMsg.r === 'subscribe') {
          this.onSubscribeData_(jMsg,connection);
        } else if(jMsg.r === 'unsubscribe') {
          this.onUnsubscribeData_(jMsg,connection);
        } else {
          console.log('UnxiTCPBroker::onSegmentData_: jMsg =<',jMsg,'>');
        }
        
      } else {
        console.log('UnxiTCPBroker::onSegmentData_: jMsg =<',jMsg,'>');
      }
    } catch(err) {
      console.log('UnxiTCPBroker::onSegmentData_: err =<',err,'>');
    }
  }
  onPublishData_(jMsg,connection) {
    console.log('UnxiTCPBroker::onPublishData_: jMsg =<',jMsg,'>');
  }
  onSubscribeData_(jMsg,connection) {
    console.log('UnxiTCPBroker::onSubscribeData_: jMsg =<',jMsg,'>');
  }
  onUnsubscribeData_(jMsg,connection) {
    console.log('UnxiTCPBroker::onUnsubscribeData_: jMsg =<',jMsg,'>');
  }
};
module.exports = UnxiTCPBroker;

const test = new UnxiTCPBroker();

