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
      console.log('Subscriber::constructor: data.toString() =<',data.toString(),'>');
      self.onTCPData_(data.toString());
    });
    this.client_.on('error', (err) => {
      console.log('Subscriber::constructor: err =<',err,'>');
    });
  }
  subscribe(channel) {
    console.log('Subscriber::subscribe: channel =<',channel,'>');
    const apiPack = {r:'subscribe',c:channel};
    const writePack = JSON.stringify(apiPack);
    const writeB64 = Buffer.from(writePack).toString('base64');
    this.client_.write(writeB64 + '\r\n');
  }
  unsubscribe(channel) {
    console.log('Subscriber::unsubscribe: channel =<',channel,'>');
    const apiPack = {r:'unsubscribe',c:channel};
    const writePack = JSON.stringify(apiPack);
    const writeB64 = Buffer.from(writePack).toString('base64');
    this.client_.write(writeB64 + '\r\n');
  }
  onTCPData_(data) {
  }

};
module.exports = Subscriber;

const test = new Subscriber();
test.subscribe('111');
test.subscribe('222');
test.unsubscribe('111');
test.unsubscribe('222');
