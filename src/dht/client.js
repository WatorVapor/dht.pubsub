'use strict';
const unix = require('unix-dgram');
const execSync = require('child_process').execSync;
'use strict';
const debug_ = true;
const DHTUtils = require('./utils.js');
const ApiUnxiUdp = require('./api_unxi_udp.js');

const utils = new DHTUtils();
const client2broker = '/dev/shm/dht.client2broker.sock';
const broker2client_cb = utils.random();
const broker2client = `/dev/shm/dht.pubsub.broker2client.${broker2client_cb}.sock`;

class DHTClient {
  constructor() {
    if(debug_) {
    }
    const self = this;
    this.api_ = new ApiUnxiUdp((msg)=>{
      self.onBrokerMsg(msg);
    });
    this.api_.bindUnixSocket(broker2client);
    this.api_.doPing({ping:client2broker,at:new Date(),cb:broker2client_cb});
    this.send_({client:broker2client});
    this.send_({peer:{}});
  }
  cid(content) {
    return utils.calcAddress(content);
  }
  pidOfMe() {
    if(this.broker_) {
      return this.broker_.id;
    }
  }
  spread(msg,cid) {
    console.log('DHTClient::spread: msg =<',msg,'>');
    this.send_({spread:{m:msg},cid:cid});
  }
  deliver(msg,pid) {
    console.log('DHTClient::deliver: msg =<',msg,'>');
    this.send_({deliver:{m:msg},pid:pid});
  }

  onBrokerMsg(msg) {
    //console.log('DHTClient::onBrokerMsg:msg=<',msg,'>');
    if(msg.pong) {
      this.onBrokerPong(msg.pong,msg.sent);
    } else if(msg.peer) {
      this.onBrokerPeer(msg.peer);
    } else if(msg.ping) {
    } else {
      console.log('DHTClient::onBrokerMsg:msg=<',msg,'>');
    }
  }
  
  onBrokerPong(pongAt,sentAt) {
    //console.log('DHTClient::onBrokerPong:pongAt=<',pongAt,'>');
    //console.log('DHTClient::onBrokerPong:sentAt=<',sentAt,'>');
    const escape_ms = new Date() - new Date(sentAt);
    //console.log('DHTClient::onBrokerPong:escape_ms=<',escape_ms,'>');
  }

  onBrokerPeer(peer) {
    //console.log('DHTClient::onBrokerPeer:peer=<',peer,'>');
    this.broker_ = peer;
  }

  send_(cmd) {
    cmd.cb = broker2client_cb;
    this.api_.send(cmd, client2broker);
  }
};
module.exports = DHTClient;
