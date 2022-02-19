'use strict';
const net = require('net');
const crypto = require('crypto');
const fs = require('fs');
const execSync = require('child_process').execSync;
const debug_ = true;
const SOCK_PATH = '/tmp/dht.pubsub.sock';
class UnxiTCPService {
  constructor(cb) {
    this.cb_ = cb;
    this.tcpReadBuffer_ = '';
    this.subscribers_ = {};
    this.connections_ = {};
    const resultRM = execSync(`rm -rf ${SOCK_PATH}`);
    if(debug_) {
      console.log('UnxiTCPService::constructor: resultRM =<',resultRM.toString(),'>');
    }
    const self = this;
    this.server_ = net.createServer((connection) => {
      const shasum = crypto.createHash('sha1');
      shasum.update(crypto.randomBytes(256).toString('base64'));
      const connectID = shasum.digest('base64');
      connection.id = connectID;
      this.connections_[connectID] = connection;
      connection.on('data', (data) => {
        self.onTCPData_(data.toString(),connection);
      });
    });
    this.server_.listen(SOCK_PATH);
  }
  onTCPData_(data,connection) {
    //console.log('UnxiTCPService::onTCPData_: data =<',data,'>');
    if(this.tcpReadBuffer_) {
      data = this.tcpReadBuffer_ + data;
    }
    const dataOflines = data.split('\r\n');
    //console.log('UnxiTCPService::onTCPData_: dataOflines =<',dataOflines,'>');
    this.tcpReadBuffer_ = dataOflines[dataOflines.length - 1];
    for(let index = 0;index < dataOflines.length - 1 ;index++) {
      this.onSegmentData_(dataOflines[index],connection);
    }
  }
  onSegmentData_(data,connection) {
    //console.log('UnxiTCPService::onSegmentData_: data =<',data,'>');
    const dataText = Buffer.from(data,'base64').toString('utf-8');
    //console.log('UnxiTCPService::onSegmentData_: dataText =<',dataText,'>');
    try {
      const jMsg = JSON.parse(dataText);
      if(jMsg.rq) {
        if(jMsg.rq === 'publish') {
          this.onPublishData_(jMsg,connection);
        } else if(jMsg.rq === 'subscribe') {
          this.onSubscribeData_(jMsg,connection);
        } else if(jMsg.rq === 'unsubscribe') {
          this.onUnsubscribeData_(jMsg,connection);
        } else {
          console.log('UnxiTCPService::onSegmentData_: jMsg =<',jMsg,'>');
        }
        
      } else {
        console.log('UnxiTCPService::onSegmentData_: jMsg =<',jMsg,'>');
      }
    } catch(err) {
      console.log('UnxiTCPService::onSegmentData_: err =<',err,'>');
    }
  }
  onPublishData_(jMsg,connection) {
    console.log('UnxiTCPService::onPublishData_: jMsg =<',jMsg,'>');
    this.cb_(jMsg);
  }
  onSubscribeData_(jMsg,connection) {
    console.log('UnxiTCPService::onSubscribeData_: jMsg =<',jMsg,'>');
    const ch = jMsg.c;
    if(ch) {
      if(!this.subscribers_[ch]) {
        this.subscribers_[ch] = [];
      }
      this.subscribers_[ch].push(connection.id);
    }
    console.log('UnxiTCPService::onSubscribeData_: this.subscribers_ =<',this.subscribers_,'>');
    this.cb_(jMsg);
  }
  onUnsubscribeData_(jMsg,connection) {
    console.log('UnxiTCPService::onUnsubscribeData_: jMsg =<',jMsg,'>');
    const ch = jMsg.c;
    if(ch) {
      if(this.subscribers_[ch]) {
        this.subscribers_[ch] = this.subscribers_[ch].filter((f)=>{return f !== connection.id});
      }
    }
    console.log('UnxiTCPService::onSubscribeData_: this.subscribers_ =<',this.subscribers_,'>');
    this.cb_(jMsg);
  }
};
module.exports = UnxiTCPService;

const test = new UnxiTCPService();

