'use strict';
const debug_ = true;
const execSync = require('child_process').execSync;
const UnxiTCPService = require('./unix_tcp_service.js');
const DHTUdp = require('./dht.udp.js');
const DHTNode = require('./dht.node.js');
const DHTBucket = require('./dht.bucket.js');
const DHTUtils = require('./dht.utils.js');
const DHTStorage = require('./dht.leveldb.js');
const utils = new DHTUtils();


class UnxiTCPBroker {
  constructor(conf) {
    if(debug_) {
      console.log('UnxiTCPBroker::constructor:conf=<',conf,'>');
    }
    const self = this;
    this.api_ = new UnxiTCPService((msg)=>{
      self.onClientMsg_(msg);
    });
    this.node_ = new DHTNode(conf);
    this.bucket_ = new DHTBucket(this.node_);
    this.dht_udp_ = new DHTUdp(conf,this.node_,this.bucket_,(msg,remote,node)=>{
      self.onDHTDataMsg(msg,remote,node);
    });
    this.dht_udp_.bindSocket(conf.portc,conf.portd);
    this.storage_ = new DHTStorage(conf); 
  }

  onDHTDataMsg(msg,remote,nodeFrom) {
    console.log('UnxiTCPBroker::onDHTDataMsg:msg=<',msg,'>');
    console.log('UnxiTCPBroker::onDHTDataMsg:remote=<',remote,'>');
    console.log('UnxiTCPBroker::onDHTDataMsg:nodeFrom=<',nodeFrom,'>');
    if(msg.subscribe) {
      this.onDHTSubscribe_(msg.subscribe,remote,nodeFrom);
    } else if(msg.publish) {
      this.onDHTPublish_(msg.publish,remote,nodeFrom);
    } else {
      console.log('UnxiTCPBroker::onDataMsg_:msg=<',msg,'>');
      console.log('UnxiTCPBroker::onDataMsg_:remote=<',remote,'>');
      console.log('UnxiTCPBroker::onDataMsg_:nodeFrom=<',nodeFrom,'>');
    }
  }
  onDHTSubscribe_(subscribe,remote,from) {
    console.log('UnxiTCPBroker::onDHTSubscribe_:subscribe=<',subscribe,'>');
    console.log('UnxiTCPBroker::onDHTSubscribe_:remote=<',remote,'>');
    console.log('UnxiTCPBroker::onDHTSubscribe_:from=<',from,'>');
    const relayGates = this.findRelayGates_(subscribe);
    console.log('UnxiTCPBroker::onDHTSubscribe_:relayGates=<',relayGates,'>');
  }
  onDHTPublish_(publish,remote,from) {
    console.log('UnxiTCPBroker::onDHTPublish_:publish=<',publish,'>');
    console.log('UnxiTCPBroker::onDHTPublish_:remote=<',remote,'>');
    console.log('UnxiTCPBroker::onDHTPublish_:from=<',from,'>');    
    const relayGates = this.findRelayGates_(publish);
    console.log('UnxiTCPBroker::onDHTPublish_:relayGates=<',relayGates,'>');
  }
  
  findRelayGates_(relayMsg) {
    const outgates = this.bucket_.near(relayMsg.address);
    //console.log('UnxiTCPBroker::findRelayGates_:outgates=<',outgates,'>');
    const relayGates = [];
    for(const outgate of outgates) {
      //console.log('UnxiTCPBroker::findRelayGates_:outgate=<',outgate,'>');
      if(outgate !== this.node_.id) {
        if(!relayMsg.footprint.includes(outgate)) {
          relayGates.push(outgate);
        }
      }
    }
    //console.log('UnxiTCPBroker::findRelayGates_:relayGates=<',relayGates,'>');
    return relayGates;
  }


  onClientMsg_(msg) {
    //console.log('UnxiTCPBroker::onClientMsg_:msg=<',msg,'>');
    if(msg.rq) {
      this.onClientRequest_(msg);
      if(msg.rq === 'publish') {
        this.onClientPublish_(msg);
      } else if(msg.rq === 'subscribe') {
        this.onClientSubscribe_(msg);
      } else if(msg.rq === 'unsubscribe') {
        this.onClientUnsubscribe_(msg);
      } else {
        console.log('UnxiTCPBroker::onClientMsg_:msg=<',msg,'>');
      }
    } else {
      console.log('UnxiTCPBroker::onClientMsg_:msg=<',msg,'>');
    }
  }
  onClientRequest_(msg) {
    console.log('UnxiTCPBroker::onClientRequest_:msg=<',msg,'>');
    const channel = msg.ch;
    const address = utils.calcAddress(channel);
    console.log('UnxiTCPBroker::onClientRequest_:address=<',address,'>');
    const dhtOut = Object.assign(msg,{});
    dhtOut.cid = address
    dhtOut.fp = [this.node_.id];
    console.log('UnxiTCPBroker::onClientRequest_:dhtOut=<',dhtOut,'>');    
    const dhtOutSign = this.node_.sign(dhtOut);
    console.log('UnxiTCPBroker::onClientRequest_:dhtOutSign=<',dhtOutSign,'>');

    const dhtOut2 = Object.assign(dhtOut,{});
    const address2 = utils.calcAddress(address);
    dhtOut2.cid = address2
    console.log('UnxiTCPBroker::onClientRequest_:dhtOut2=<',dhtOut2,'>');
    const dhtOut2Sign = this.node_.sign(dhtOut2);
    console.log('UnxiTCPBroker::onClientRequest_:dhtOut2Sign=<',dhtOut2Sign,'>');

  }
  onClientSubscribe_(msg) {
    console.log('UnxiTCPBroker::onClientSubscribe_:msg=<',msg,'>');
  }

  onClientUnsubscribe_(msg) {
    console.log('UnxiTCPBroker::onClientUnsubscribe_:msg=<',msg,'>');
  }
  onClientPublish_(msg) {
    console.log('UnxiTCPBroker::onClientPublish_:msg=<',msg,'>');
  }
  
  /*
  doDHTSubscribe_(address,channel) {
    const outgates = this.bucket_.near(address);
    //console.log('UnxiTCPBroker::onApiSubscribe:outgates=<',outgates,'>');
    if(outgates.includes(this.node_.id)) {
      this.storage_.store(channel,address,this.node_.id);      
    }
    this.dht_udp_.broadcastSubscribe(outgates,channel,address);
  }
  }
  doDHTPublish_(address,channel,message,cb) {
    console.log('UnxiTCPBroker::doDHTPublish_:address=<',address,'>');
    console.log('UnxiTCPBroker::doDHTPublish_:channel=<',channel,'>');
    console.log('UnxiTCPBroker::doDHTPublish_:message=<',message,'>');
    console.log('UnxiTCPBroker::doDHTPublish_:cb=<',cb,'>');
    const outgates = this.bucket_.near(address);
    //console.log('UnxiTCPBroker::onApiSubscribe:outgates=<',outgates,'>');
    if(outgates.includes(this.node_.id)) {
      const self = this;
      this.storage_.fetch(address,(endpoint)=> {
        self.onDHTSubscribeHint_(endpoint,message,channel,cb);
      });
    }
    this.dht_udp_.broadcastPublish(outgates,channel,address,message,cb);    
  }

  onDHTSubscribeHint_(endpoints,msgPub,channel,cb) {
    console.log('UnxiTCPBroker::onDHTSubscribeHint_:endpoints=<',endpoints,'>');
    console.log('UnxiTCPBroker::onDHTSubscribeHint_:msgPub=<',msgPub,'>');
    for(const endpoint of endpoints) {
      const msgDHT = {
        pubReal:{
          channel:channel,
          msg:msgPub,
          cb,cb
        },
        dist:endpoint.node
      }
      console.log('UnxiTCPBroker::onDHTSubscribeHint_:msgDHT=<',msgDHT,'>');
    }
  }
  */
  
};
module.exports = UnxiTCPBroker;
