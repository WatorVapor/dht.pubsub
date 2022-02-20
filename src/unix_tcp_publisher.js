'use strict';
const net = require('net');
const fs = require('fs');
const execSync = require('child_process').execSync;
const debug_ = true;
const SOCK_PATH = '/tmp/dht.pubsub.sock';

class Publisher {
  constructor() {
    if(debug_) {
    }
    this.client_ = net.createConnection(SOCK_PATH);
    const self = this;
    this.client_.on('connect', () => {
      console.log('Publisher::constructor: connected!!');
      //console.log('Publisher::publish: this.client_ =<',this.client_,'>');
      this.client_.ready = true;
    });
    this.client_.on('end', () => {
      console.log('Publisher::constructor: ended!!');
    });
    this.client_.on('data', (data) => {
      console.log('Publisher::constructor: data.toString() =<',data.toString(),'>');
      self.onTCPData_(data.toString());
    });
    this.client_.on('error', (err) => {
      console.log('Publisher::constructor: err =<',err,'>');
    });
  }
  publish(channel,msg) {
    console.log('Publisher::publish: channel =<',channel,'>');
    console.log('Publisher::publish: msg =<',msg,'>');
    const apiPack = {rq:'publish',ch:channel,py:msg};
    const writePack = JSON.stringify(apiPack);
    const writeB64 = Buffer.from(writePack).toString('base64');
    this.client_.write(writeB64 + '\r\n');
  }
  onTCPData_(data) {
  }

};
module.exports = Publisher;

