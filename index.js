const http = require('http');
const url = require('url');
const WebSocket = require('ws');

const hostname = '192.168.1.215';
const port = 9000;

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('P2P broker');
});

const connections = [];
let offer = null;

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', function connection(ws, request, client) {  
  const initiator = request.url.substr(request.url.indexOf('initiator=') + 'initiator='.length);
  connections.push({ initiator, ws });

  console.log(`client connected to websocket server. initiator: ${initiator}`);
  // if (offer !== null && !initiator) {
    console.log('sending initial...');
    ws.send(offer);
  // }

  ws.on('message', function incoming(message) {
    console.log('received message');
    if (initiator) {
      offer = message;
      connections.forEach(conn => {
        if (!conn.initiator) {
          conn.ws.send(offer);
          console.log('sending...');
        }
      });
    }
  });

  ws.on('close', function close(code, reason) {
    console.log(`client disconnected with code ${code}`);
    connections.splice(connections.indexOf(connections.find(conn => conn.ws === ws)));
  });
});

server.on('upgrade', function upgrade(request, socket, head) {
  const pathname = url.parse(request.url).pathname;
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, function done(ws) {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
