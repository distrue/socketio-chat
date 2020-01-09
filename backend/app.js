const backPort = 4000;

var app = require('express')();
var server = require('http').createServer(app);

app.all('/*', function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

// online인 user 들의 socket 정보를 담고 있는 객체
var userdb = [];

// user 들의 message 기록을 담고 있는 객체, mongoDB로 전환 필요
// 채팅 객체에 담겨야 하는 data 형식은 아래와 같음
// {receiver: "cli-0", data: "Hello", type: "text", date: new Date()}
// {receiver: "cli-0", data: "imageURL", type: "image", date: new Date()}
// 이미지의 경우 업로드 된걸 cli가 확인하고 server에 text처럼 msg 저장을 요청할 예정
var msgdb = {
  'cli-0': {'cli-1': [
    {receiver: "cli-0", data: "Hello", type: "text", date: new Date()},
    {receiver: "cli-1", data: "Hello too", type: "text", date: new Date()}
  ]},
  'cli-1': {'cli-0': [
    {receiver: "cli-0", data: "Hello", type: "text", date: new Date()},
    {receiver: "cli-1", data: "Hello too", type: "text", date: new Date()}
  ]},
};

// TODO: 기존 method에 userID (users의 id면 될 듯) 전송을 추가해 줄 것
app.get('/isLogin', (req, res) => {
  res.status(200).send({id: `cli-${userdb.length}`});
});

// TODO: 채팅리스트에서 나의 chat 대상과 online 상태를 전달하고자 함
// 담겨야 하는 사항: 
// 1. 내가 chat기록을 갖고 있는 대상 (msgdb 참고)
// 2. 각 대상이 userdb에 온라인으로 되어있는지 확인
app.get('/onlines', (req, res) => {
  res.status(200).json({});
})

// 기존 message 불러오기
// TODO: msgdb를 mongodb model로 수정
// 기존 기획과 달리 날짜 나누지 x, 초기 구현에 복잡하게 넣지 않고 나중에 고도화
app.get('/msgs', (req, res) => {
  console.log(req.query.from, req.query.to);
  if(msgdb[req.query.from]) {
    if(msgdb[req.query.from][req.query.to]) {
      return res.status(200).json({msg: msgdb[req.query.from][req.query.to]});
    }
  }
  return res.status(200).json({});
});

server.listen(backPort, () => {
  console.log(`socket.io server listening on port ${backPort}`);
});


// 그대로 삽입하되, line 5의 server 객체를 통해 io를 require하는 것을 참조
var chatServer = require('http').createServer();
var io = require('socket.io')(chatServer);
io.on('connection', (socket) => {
  // on (method): ('event_name', event handler)

  // client login query
  socket.on('login', (cliId) => { // data={name, }
    console.log(`logged in client: ${cliId}, ${socket.id}`);
    const fidx = userdb.findIndex(client => client.cliId === cliId);
    if (fidx !== -1) {
      userdb[fidx] = { cliId: cliId, socketId: socket.id };
    } else {
      userdb.push({ cliId: cliId, socketId: socket.id });
    }
  });

  socket.on('chat', (msg) => {
    // 1. client로부터 메시지를 송신받음
    const sidx = userdb.findIndex(client => client.socketId === socket.id);
    if(sidx === -1) return; // 전송자가 접속자 db에 존재하지 않는 경우
    const sender = userdb[sidx].cliId;
    console.log(`From ${sender} to ${msg.receiver}: ${msg.data}`);
    
    // 2. db에 저장
    // TODO: msgdb에 저장

    // 3. 자신에게 전송
    socket.emit('chat', msg);

    // 4. msg의 receiver에게 다시 전송
    const ridx = userdb.findIndex(client => client.cliId === msg.receiver);
    if (ridx === -1) return; // 수신자를 찾을 수 없는 경우
    const receiver = userdb[ridx].socketId;
    io.to(receiver).emit('chat', msg);
  });
});

chatServer.listen(5000, () => {
  console.log(`socket.io server listening on port 5000`);
});
