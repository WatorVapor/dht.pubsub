'use strict';
const dgram = require('dgram');
const DHTMachine = require('./machine.js');
const debug_ = true;
const NODE_LOST_TIME_OUT_MS = 5*1000;
const NODE_LOST_TIME_OUT_MAX = 10;

class DHTUdp {
  constructor(conf,node,bucket,onMsg) {
    if(debug_) {
      console.log('DHTUdp::constructor: conf =<',conf,'>');
    }
    this.conf_ = conf;
    this.client_ = dgram.createSocket('udp6');
    this.onMsg_ = onMsg;
    this.machine_ = new DHTMachine({localhost:false});
    setTimeout(this.enterMesh_.bind(this),1000);
    this.node_ = node;    
    this.bucket_ = bucket;
    this.worldNodes_ = {};
    setInterval(this.doDHTPing_.bind(this),1*1000);
  }
  
  bindSocket(portc,portd) {
    this.bindCtrlSocket_(portc);
    this.bindDataSocket_(portd);
  }
  sendCtrl(cmd,port,host) {
    const signedCmd = this.node_.signCtrl(cmd);
    const cmdMsg = Buffer.from(JSON.stringify(signedCmd));
    try {
      this.client_.send(cmdMsg, 0, cmdMsg.length, port,host);
    } catch(err) {
      console.log('DHTUdp::sendCtrl:err=<',err,'>');
    }
  }
  sendData(cmd,port,host) {
    const signedCmd = this.node_.signData(cmd);
    const cmdMsg = Buffer.from(JSON.stringify(signedCmd));
    try {
      this.client_.send(cmdMsg, 0, cmdMsg.length, port,host);
    } catch(err) {
      console.log('DHTUdp::sendData:err=<',err,'>');
    }
  }
  
  
  spread(outgates,spread,cid,cb) {
    //console.log('DHTUdp::spread: outgates =<',outgates,'>');
    const msgDHT = {
      cid:cid,
      spread:JSON.stringify(spread),
      cb:cb
    }
    const outEPs = {};
    let isDone = false;
    for(const gate of outgates) {
      //console.log('DHTUdp::spread: gate =<',gate,'>');
      if(this.node_.id !== gate) {
        outEPs[gate] = this.worldNodes_[gate];
      } else {
        if(isDone === false) {
          this.onSpread2Me(msgDHT);
        }
        isDone = true;
      }
    }
    //console.log('DHTUdp::spread: outEPs =<',outEPs,'>');
    for(const outEPIndex in outEPs) {
      const outEP = outEPs[outEPIndex];
      //console.log('DHTUdp::spread: outEP =<',outEP,'>');
      this.sendData(msgDHT,outEP.portd,outEP.address);
    }
  }
  onSpread2Me(msgDHT) {
    console.log('DHTUdp::onSpread2Me: msgDHT =<',msgDHT,'>');
    if(typeof this.onMsg_ === 'function') {
      this.onMsg_(msgDHT,this.node_.id);
    }
  }

  deliver(outgates,deliver,pid,cb) {
    //console.log('DHTUdp::deliver: outgates =<',outgates,'>');
    const msgDHT = {
      pid:pid,
      deliver:JSON.stringify(deliver),
      cb:cb
    }
    const outEPs = {};
    let isDone = false;
    for(const gate of outgates) {
      //console.log('DHTUdp::deliver: gate =<',gate,'>');
      if(this.node_.id !== gate) {
        outEPs[gate] = this.worldNodes_[gate];
      } else {
        if(isDone === false) {
          this.onDeliver2Me(msgDHT);
        }
        isDone = true;
      }
    }
    //console.log('DHTUdp::deliver: outEPs =<',outEPs,'>');
    for(const outEPIndex in outEPs) {
      const outEP = outEPs[outEPIndex];
      //console.log('DHTUdp::deliver: outEP =<',outEP,'>');
      this.sendData(msgDHT,outEP.portd,outEP.address);
    }
  }
  onDeliver2Me(msgDHT) {
    console.log('DHTUdp::onDeliver2Me: msgDHT =<',msgDHT,'>');
    if(typeof this.onMsg_ === 'function') {
      this.onMsg_(msgDHT,this.node_.id);
    }
  }
 
  enterMesh_() {
    //console.log('DHTUdp::enterMesh_: this.conf_ =<',this.conf_,'>');
    for(const entrance of this.conf_.entrances) {
      //console.log('DHTUdp::enterMesh_: entrance =<',entrance,'>');
      const entryMesh = {
        entry:{
          portc:this.portc_,
          portd:this.portd_,
          trap:this.conf_.trap,
          at:new Date(),
        }
      }
      this.sendCtrl(entryMesh,entrance.portc,entrance.host);
    }
  }
  onCtrlMsg_(msg,remote,nodeFrom) {
    //console.log('DHTUdp::onCtrlMsg_:msg=<',msg,'>');
    //console.log('DHTUdp::onCtrlMsg_:remote=<',remote,'>');
    //console.log('DHTUdp::onCtrlMsg_:nodeFrom=<',nodeFrom,'>');
    if(msg.entry) {
      this.onDHTEntry(msg.entry,remote,nodeFrom);
    } else if(msg.welcome) {
      this.onDHTWelcome(msg.welcome,remote,nodeFrom);
    } else if(msg.ping) {
      this.onDHTPing(msg.ping,remote,nodeFrom);
    } else if(msg.pong) {
      this.onDHTPong(msg.pong,remote,nodeFrom);
    } else {
      console.log('DHTUdp::onCtrlMsg_:msg=<',msg,'>');
      console.log('DHTUdp::onCtrlMsg_:remote=<',remote,'>');
      console.log('DHTUdp::onCtrlMsg_:nodeFrom=<',nodeFrom,'>');
    }
  }
  onDHTEntry(entry,remote,nodeFrom) {
    console.log('DHTUdp::onDHTEntry:entry=<',entry,'>');
    //console.log('DHTUdp::onDHTEntry:remote=<',remote,'>');
    //console.log('DHTUdp::onDHTEntry:nodeFrom=<',nodeFrom,'>');
    const address = remote.address;
    const portc = entry.portc;
    const portd = entry.portd;
    //console.log('DHTUdp::onDHTEntry:address=<',address,'>');
    //console.log('DHTUdp::onDHTEntry:portc=<',portc,'>');
    this.worldNodes_[nodeFrom] = {
      address:address,
      portc:portc,
      portd:portd,
      trap:entry.trap,
      at:new Date().toISOString()
    }
    const welcome = {
      welcome:{
        nodes:this.worldNodes_,
        at:new Date().toISOString()
      }
    };
    this.sendCtrl(welcome,portc,address);
    //console.log('DHTUdp::onDHTEntry:this.worldNodes_=<',this.worldNodes_,'>');
  }
  onDHTWelcome(welcome,remote,nodeFrom) {
    //console.log('DHTUdp::onDHTWelcome:welcome=<',welcome,'>');
    //console.log('DHTUdp::onDHTWelcome:remote=<',remote,'>');
    //console.log('DHTUdp::onDHTWelcome:nodeFrom=<',nodeFrom,'>');
    for(const nodeKey in welcome.nodes) {
      //console.log('DHTUdp::onDHTWelcome:nodeKey=<',nodeKey,'>');
      const endpoint = welcome.nodes[nodeKey];
      //console.log('DHTUdp::onDHTWelcome:endpoint=<',endpoint,'>');
      this.worldNodes_[nodeKey] = endpoint;
    }
    //console.log('DHTUdp::onDHTWelcome:this.worldNodes_=<',this.worldNodes_,'>');
  }
  onDHTPing(ping,remote,nodeFrom) {
    //console.log('DHTUdp::onDHTPing:ping=<',ping,'>');
    //console.log('DHTUdp::onDHTPing:remote=<',remote,'>');
    //console.log('DHTUdp::onDHTPing:nodeFrom=<',nodeFrom,'>');
    const node = this.worldNodes_[nodeFrom];
    //console.log('DHTUdp::onDHTPing:node=<',node,'>');
    if(node) {
      const pong = {
        pong:{
          s:ping.s,
          r:new Date()
        }
      };
      this.sendCtrl(pong,node.portc,node.address);
    }
  }

  onDHTPong(pong,remote,nodeFrom) {
    //console.log('DHTUdp::onDHTPong:pong=<',pong,'>');
    //console.log('DHTUdp::onDHTPong:remote=<',remote,'>');
    //console.log('DHTUdp::onDHTPong:nodeFrom=<',nodeFrom,'>');
    const endpoint = this.worldNodes_[nodeFrom];
    //console.log('DHTUdp::onDHTPong:endpoint=<',endpoint,'>');
    if(endpoint) {
      const ttl = new Date() - new Date(pong.s);
      //console.log('DHTUdp::onDHTPong:ttl=<',ttl,'>');
      endpoint.ttl = ttl;
      endpoint.at = pong.r;
      //console.log('DHTUdp::onDHTPong:nodeFrom=<',nodeFrom,'>');
      //console.log('DHTUdp::onDHTPong:endpoint=<',endpoint,'>');
      this.bucket_.update(nodeFrom,endpoint);
    }
    for(const nodeCheck in this.worldNodes_) {
      //console.log('DHTUdp::onDHTPong:nodeCheck=<',nodeCheck,'>');
      if(nodeCheck !== this.node_.id) {
        const endpointCheck = this.worldNodes_[nodeCheck];
        //console.log('DHTUdp::onDHTPong:endpointCheck=<',endpointCheck,'>');
        const escape_ms = new Date() - new Date(endpointCheck.at);
        //console.log('DHTUdp::onDHTPong:escape_ms=<',escape_ms,'>');
        if(escape_ms > NODE_LOST_TIME_OUT_MS) {
          //console.log('DHTUdp::onDHTPong:escape_ms=<',escape_ms,'>');
          //console.log('DHTUdp::onDHTPong:nodeCheck=<',nodeCheck,'>');
          //console.log('DHTUdp::onDHTPong:endpointCheck=<',endpointCheck,'>');
          if(endpointCheck.timeout > 0) {
            endpointCheck.timeout++;
          } else {
            endpointCheck.timeout = 1;
          }
          if(endpointCheck.timeout > NODE_LOST_TIME_OUT_MAX) {
            delete this.worldNodes_[nodeCheck];
          }
          this.bucket_.remove(nodeCheck);
        }
      }
    }
  }

  
  doDHTPing_() {
    //console.log('DHTUdp::doDHTPing_:this.worldNodes_=<',this.worldNodes_,'>');
    for(const nodeKey in this.worldNodes_) {
      //console.log('DHTUdp::doDHTPing_:nodeKey=<',nodeKey,'>');
      const node = this.worldNodes_[nodeKey];
      //console.log('DHTUdp::doDHTPing_:node=<',node,'>');
      if(nodeKey !== this.node_.id) {
        //console.log('DHTUdp::doDHTPing_:node=<',node,'>');
        //console.log('DHTUdp::doDHTPing_:nodeKey=<',nodeKey,'>');
        const pingDHT = {
          ping:{
            s:new Date()
          }
        };
        this.sendCtrl(pingDHT,node.portc,node.address);
      }
    }
  }



  bindCtrlSocket_(portc) {
    const self = this;
    const udpServerCtrl = dgram.createSocket('udp6');
    udpServerCtrl.on('listening', () => {
      //console.log('DHTUdp::bindCtrlSocket_: listening udpServerCtrl =<',udpServerCtrl,'>');
    });
    udpServerCtrl.on('message', (message, remote) =>{
      //console.log('DHTUdp::bindCtrlSocket_: message message =<',message.toString(),'>');
      //console.log('DHTUdp::bindCtrlSocket_: message remote =<',remote,'>');
      try {
        const jMsg = JSON.parse(message.toString());
        //console.log('DHTUdp::bindCtrlSocket_: message jMsg =<',jMsg,'>');
        const result = this.node_.verifyCtrl(jMsg);
        //console.log('DHTUdp::bindCtrlSocket_: message result =<',result,'>');
        if(result) {
          const node = this.node_.calcID(jMsg);
          //console.log('DHTUdp::bindCtrlSocket_: message node =<',node,'>');
          self.onCtrlMsg_(jMsg.p,remote,node);
        }
      } catch(err) {
        console.log('DHTUdp::bindCtrlSocket_: message err =<',err,'>');
      }
    });
    udpServerCtrl.bind(portc);
    this.portc_ = portc;
  }

  bindDataSocket_(portd) {
    const self = this;
    const udpServerData = dgram.createSocket('udp6');
    udpServerData.on('listening', () => {
      //console.log('DHTUdp::bindDataSocket_: listening udpServerData =<',udpServerData,'>');
    });
    udpServerData.on('message', (message, remote) =>{
      //console.log('DHTUdp::bindDataSocket_: message message =<',message.toString(),'>');
      //console.log('DHTUdp::bindDataSocket_: message remote =<',remote,'>');
      try {
        const jMsg = JSON.parse(message.toString());
        //console.log('DHTUdp::bindDataSocket_: message jMsg =<',jMsg,'>');
        const result = this.node_.verifyData(jMsg);
        //console.log('DHTUdp::bindDataSocket_: message result =<',result,'>');
        if(result) {
          const node = this.node_.calcID(jMsg);
          //console.log('DHTUdp::bindDataSocket_: message node =<',node,'>');
          self.onDataMsg_(jMsg,node);
        }
      } catch(err) {
        console.log('DHTUdp::bindDataSocket_: message err =<',err,'>');
      }
    });
    udpServerData.bind(portd);
    this.portd_ = portd;
  }


  onDataMsg_(msg,node) {
    //console.log('DHTUdp::onDataMsg_:msg=<',msg,'>');
    //console.log('DHTUdp::onDataMsg_:node=<',node,'>');
    if(typeof this.onMsg_ === 'function') {
      this.onMsg_(msg,node);
    }
  }
};
module.exports = DHTUdp;
