'use strict';
const debug_ = true;
const unix = require('unix-dgram');
const execSync = require('child_process').execSync;
const ApiUnxiUdp = require('./api_unxi_udp.js');
const DHTUdp = require('./udp.js');
const DHTNode = require('./node.js');
const DHTBucket = require('./bucket.js');
const DHTUtils = require('./utils.js');
const utils = new DHTUtils();

const client2DHTBroker = '/dev/shm/dht.client2broker.sock';


class DHTBroker {
  constructor(conf) {
    if(debug_) {
      console.log('DHTBroker::constructor:conf=<',conf,'>');
    }
    const self = this;
    this.api_ = new ApiUnxiUdp((msg)=>{
      self.onApiMsg(msg);
    });
    this.api_.bindUnixSocket(client2DHTBroker);
    this.api_cbs_ = {};
    this.localChannels_ = {};
    this.node_ = new DHTNode(conf);
    this.bucket_ = new DHTBucket(this.node_);
    this.dht_udp_ = new DHTUdp(conf,this.node_,this.bucket_,(msg,node)=>{
      self.onDHTDataMsg(msg,node);
    });
    this.dht_udp_.bindSocket(conf.portc,conf.portd);
  }

  onDHTDataMsg(msg,nodeFrom) {
    console.log('DHTBroker::onDHTDataMsg:msg=<',msg,'>');
    console.log('DHTBroker::onDHTDataMsg:nodeFrom=<',nodeFrom,'>');
    /*
      local dht msg
    */
    if(nodeFrom === this.node_.id) {
      if(msg.spread) {
        this.onDHTSpread_(msg.spread);
      } else if(msg.deliver) {
        this.onDHTDeliver_(msg.deliver);
      } else {
        console.log('DHTBroker::onDataMsg_:msg=<',msg,'>');
        console.log('DHTBroker::onDataMsg_:nodeFrom=<',nodeFrom,'>');
      }
      return;
    }
    /*
      remote dht msg
    */
    if(msg.p && msg.p.pid && msg.p.pid !== this.node_.id) {
      this.relayDHTDataMsg_(msg,nodeFrom);
      return;
    }
    if(msg.p && msg.p.cid) {
      const outgates = this.bucket_.near(msg.p.cid);
      console.log('DHTBroker::onDHTDataMsg:outgates=<',outgates,'>');
      console.log('DHTBroker::onDHTDataMsg:this.node_.id=<',this.node_.id,'>');
      if(!outgates.includes(this.node_.id)) {
        this.relayDHTDataMsg_(msg,nodeFrom);
        return;        
      }
    }
    if(msg.p.spread) {
      this.onDHTSpread_(msg.p.spread);
    } else if(msg.p.deliver) {
      this.onDHTDeliver_(msg.p.deliver);
    } else {
      console.log('DHTBroker::onDataMsg_:msg=<',msg,'>');
      console.log('DHTBroker::onDataMsg_:nodeFrom=<',nodeFrom,'>');
    }
  }
  
  onDHTSpread_(dhtMsg) {
    console.log('DHTBroker::onDHTSpread_:dhtMsg=<',dhtMsg,'>');
    console.log('DHTBroker::onDHTSpread_:this.api_cbs_=<',this.api_cbs_,'>');
    const apiMsg = {
      spread:dhtMsg
    };
    for(const cbKey in this.api_cbs_) {
      //console.log('DHTBroker::onDHTSpread_:cbKey=<',cbKey,'>');
      const cbEntry = this.api_cbs_[cbKey];
      //console.log('DHTBroker::onDHTSpread_:cbEntry=<',cbEntry,'>');
      try {
        this.api_.send(apiMsg,cbEntry.path);
      } catch(err) {
        console.log('DHTBroker::onDHTSpread_:err=<',err,'>');
      }
    }
  }
  onDHTDeliver_(dhtMsg) {
    console.log('DHTBroker::onDHTDeliver_:dhtMsg=<',dhtMsg,'>');
    console.log('DHTBroker::onDHTDeliver_:this.api_cbs_=<',this.api_cbs_,'>');
    const apiMsg = {
      deliver:dhtMsg
    };
    for(const cbKey in this.api_cbs_) {
      //console.log('DHTBroker::onDHTDeliver_:cbKey=<',cbKey,'>');
      const cbEntry = this.api_cbs_[cbKey];
      //console.log('DHTBroker::onDHTDeliver_:cbEntry=<',cbEntry,'>');
      try {
        this.api_.send(apiMsg,cbEntry.path);
      } catch(err) {
        console.log('DHTBroker::onDHTDeliver_:err=<',err,'>');
      }
    }
  }
  
  findRelayGates_(relayMsg) {
    const outgates = this.bucket_.near(relayMsg.address);
    //console.log('DHTBroker::findRelayGates_:outgates=<',outgates,'>');
    const relayGates = [];
    for(const outgate of outgates) {
      //console.log('DHTBroker::findRelayGates_:outgate=<',outgate,'>');
      if(outgate !== this.node_.id) {
        if(!relayMsg.footprint.includes(outgate)) {
          relayGates.push(outgate);
        }
      }
    }
    //console.log('DHTBroker::findRelayGates_:relayGates=<',relayGates,'>');
    return relayGates;
  }
  
  relayDHTDataMsg_(relayMsg,nodeFrom) {
    console.log('DHTBroker::relayDHTDataMsg_:relayMsg=<',relayMsg,'>');
    console.log('DHTBroker::relayDHTDataMsg_:nodeFrom=<',nodeFrom,'>');
    const address = relayMsg.p.pid || relayMsg.p.cid;
    console.log('DHTBroker::relayDHTDataMsg_:address=<',address,'>');
    const outgates = this.bucket_.near(address);
    console.log('DHTBroker::relayDHTDataMsg_:outgates=<',outgates,'>');
  }


  onApiMsg(msg) {
    //console.log('DHTBroker::onApiMsg:msg=<',msg,'>');
    if(msg.client) {
      this.onApiClient(msg.client,msg.cb);
    } else if(msg.peer) {
      this.onApiPeer(msg.cb);
    } else if(msg.ping) {
      this.onApiPing(msg.at,msg.cb);
    } else if(msg.spread) {
      this.onApiSpread(msg.spread,msg.cid,msg.cb);
    } else if(msg.deliver) {
      this.onApiDeliver(msg.deliver,msg.pid,msg.cb);
    } else {
      console.log('DHTBroker::onApiMsg:msg=<',msg,'>');
    }
  }
  onApiClient(path,cb) {
    //console.log('DHTBroker::onApiClient:path=<',path,'>');
    //console.log('DHTBroker::onApiClient:cb=<',cb,'>');
    this.api_cbs_[cb] = {path:path,at:(new Date()).toISOString()};
    //console.log('DHTBroker::onApiClient:this.api_cbs_=<',this.api_cbs_,'>');
    for(const cbKey in this.api_cbs_) {
      //console.log('DHTBroker::onApiClient:cbKey=<',cbKey,'>');
      const api_cb = this.api_cbs_[cbKey];
      const escape_ms = new Date() - new Date(api_cb.at);
     // console.log('DHTBroker::onApiClient:escape_ms=<',escape_ms,'>');
      if(escape_ms > 5000) {
        delete this.api_cbs_[cbKey];
      }
    }
    //console.log('DHTBroker::onApiClient:this.api_cbs_=<',this.api_cbs_,'>');
  }
  onApiPeer(cb) {
    //console.log('DHTBroker::onApiPeer:cb=<',cb,'>');
    //console.log('DHTBroker::onApiPeer:this.api_cbs_=<',this.api_cbs_,'>');    
    const reply = this.api_cbs_[cb];
    if(reply) {
      //console.log('DHTBroker::onApiPeer:reply=<',reply,'>');
      //console.log('DHTBroker::onApiPeer:atSent=<',atSent,'>');
      this.api_.send({peer:{id:this.node_.id}},reply.path);
    }
  }
  onApiPing(atSent,cb) {
    //console.log('DHTBroker::onApiPing:cb=<',cb,'>');
    //console.log('DHTBroker::onApiPing:this.api_cbs_=<',this.api_cbs_,'>');    
    const reply = this.api_cbs_[cb];
    if(reply) {
      //console.log('DHTBroker::onApiPing:reply=<',reply,'>');
      //console.log('DHTBroker::onApiPing:atSent=<',atSent,'>');
      reply.at = atSent;
      this.api_.send({pong:new Date,sent:atSent},reply.path);
    }
  }
  onApiSpread(spread,cid,cb) {
    //console.log('DHTBroker::onApiSpread:spread=<',spread,'>');
    //console.log('DHTBroker::onApiSpread:cid=<',cid,'>');
    //console.log('DHTBroker::onApiSpread:cb=<',cb,'>');
    const outgates = this.bucket_.near(cid);
    //console.log('DHTBroker::onApiSpread:outgates=<',outgates,'>');
    this.dht_udp_.spread(outgates,spread,cid,cb);

  }
  onApiDeliver(deliver,pid,cb) {
    //console.log('DHTBroker::onApiDeliver:deliver=<',deliver,'>');
    //console.log('DHTBroker::onApiDeliver:pid=<',pid,'>');
    //console.log('DHTBroker::onApiDeliver:cb=<',cb,'>');
    const outgates = this.bucket_.near(pid);
    //console.log('DHTBroker::onApiDeliver:outgates=<',outgates,'>');
    this.dht_udp_.deliver(outgates,deliver,pid,cb);
  }
 
};
module.exports = DHTBroker;
