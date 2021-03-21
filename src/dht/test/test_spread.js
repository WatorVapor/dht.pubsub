'use strict';
const DHTClient = require('../client.js');
const client = new DHTClient();
const spreadPayload = {
  channel:'aaa',
  msg:'hello world'
}
const cid = client.cid(spreadPayload.channel);
client.spread(spreadPayload,cid);
