'use strict';
const DHTClient = require('../client.js');
const onDHTSpread = (spread)=> {
  console.log('test::onDHTSpread:spread=<',spread,'>');
}
const onDHTDeliver = (deliver)=> {
  console.log('test::onDHTDeliver:deliver=<',deliver,'>');
}
const client = new DHTClient(onDHTSpread,onDHTDeliver);
const spreadPayload = {
  channel:'aaa',
  msg:'hello world'
}
const cid = client.cid(spreadPayload.channel);
client.spread(spreadPayload,cid);
