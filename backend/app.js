const backPort = 4000;

var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

var userdb = [];
var msgdb = {
  'cli-0': {'cli-1': [
    {receiver: "cli-0", data: "Hello", type: "text"},
    {receiver: "cli-1", data: "Hello too", type: "text"}
  ]},
  'cli-1': {'cli-0': [
    {receiver: "cli-0", data: "Hello", type: "text"},
    {receiver: "cli-1", data: "Hello too", type: "text"}
  ]},
};

app.get('/isLogin', (req, res) => {
  res.status(200).send({nickname: `cli-${userdb.length}`});
});

app.get('/onlines', (req, res) => {
  // db의 닉네임만 출력하도록 변경
  res.status(200).json({onlines: userdb});
})

app.get('/msgs', (req, res) => {
  console.log(req.query.from, req.query.to);
  if(msgdb[req.query.from]) {
    if(msgdb[req.query.from][req.query.to]) {
      return res.status(200).json({msg: msgdb[req.query.from][req.query.to]});
    }
  }
  return res.status(200).json({});
});

io.on('connection', (socket) => {

  // on (method): ('event_name', event handler)

  // client login query
  socket.on('login', (nick) => { // data={name, }
    console.log(`logged in client: ${nick}, ${socket.id}`);
    const fidx = userdb.findIndex(client => client.nick === nick);
    if (fidx !== -1) {
      userdb[fidx] = { nick: nick, socketId: socket.id };
    } else {
      userdb.push({ nick: nick, socketId: socket.id });
    }
  });

  socket.on('chat', (msg) => {
    // 1. client로부터 메시지를 송신받음
    const sidx = userdb.findIndex(client => client.socketId === socket.id);
    if(sidx === -1) return; // 전송자가 접속자 db에 존재하지 않는 경우
    const sender = userdb[sidx].nick;
    console.log(`From ${sender} to ${msg.receiver}: ${msg.data}`);
    
    // 2. db에 저장
    // msgdb

    // 3. 자신에게 전송
    socket.emit('chat', msg);

    // 4. msg의 receiver에게 다시 전송
    const ridx = userdb.findIndex(client => client.nick === msg.receiver);
    if (ridx === -1) return; // 수신자를 찾을 수 없는 경우
    const receiver = userdb[ridx].socketId;
    io.to(receiver).emit('chat', msg);
  });
});

server.listen(backPort, () => {
  console.log(`socket.io server listening on port ${backPort}`);
});
