'use strict';
const fs = require('fs');
const level = require('level')

class DHTStorage {
  constructor(config) {
    console.log('DHTStorage::constructor config=<',config,'>');
    this.config_ = config;
    const leveldb_path = `${config.reps.dht}/store`;
    console.log('DHTStorage::constructor leveldb_path=<',leveldb_path,'>');
    this.db_ = level(leveldb_path);
  }
  
  store(channel,address,node) {
    //console.log('DHTStorage::store address=<',address,'>');
    //console.log('DHTStorage::store address=<',address,'>');
    //console.log('DHTStorage::store node=<',node,'>');
    const msgStore = {
      address:address,
      node:node,
      subscribe:{
        channel:channel
      }
    };
  }
  
  fetch(address,cb) {
    //console.log('DHTStorage::fetch address=<',address,'>');
    const findFilter = {
      address: address
    };
  }
}
module.exports = DHTStorage;

