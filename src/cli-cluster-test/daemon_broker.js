'use strict';
const UnxiTCPBroker = require('../unix_tcp_broker.js');
const dht_port_begin = 1236;
const dht_entrances = [
  {
    host:'ermu4.wator.xyz',
    portc:1234,
    portd:1234+1,
  },
  {
    host:'ermu3.wator.xyz',
    portc:1234,
    portd:1234+1,
  },
];
for(let index ;index < 10;index++) {
  const dht_port = dht_port_begin + i*2;
  const dht_port_data = dht_port_begin + i*2 + 1;
  
  const resultRM = execSync(`rm -rf /dev/shm/dht.pubsub.cluster`);
  const resultMKDIR = execSync(`mkdir -p /dev/shm/dht.pubsub.cluster/${index}`);
  const dht_config = {
    entrances: dht_entrances,
    reps: {
      dht:`/dev/shm/dht.pubsub.cluster/${index}/dht.pubsub`
    },
    portc:dht_port,
    portd:dht_port_data,
    trap:true
  };
  const broker = new UnxiTCPBroker(dht_config,`/dev/shm/dht.pubsub.cluster/${index}.sock`);
}

