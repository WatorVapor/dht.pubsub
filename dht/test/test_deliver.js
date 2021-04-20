'use strict';
const DHTClient = require('../client.js');
const onDHTSpread = (spread)=> {
  console.log('test::onDHTSpread:spread=<',spread,'>');
}
const onDHTDeliver = (deliver)=> {
  console.log('test::onDHTDeliver:deliver=<',deliver,'>');
}

const client = new DHTClient(onDHTSpread,onDHTDeliver);
const deliverPayload = {
  channel:'aaa',
  msg:'hello world'
}
setTimeout(()=>{
  //const pid = client.pidOfMe();
  const pid = 'mfs6bsc2877wjbwqpazm5kyzk7k9342c';
  client.deliver(deliverPayload,pid);  
},1000);
