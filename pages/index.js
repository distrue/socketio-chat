/* eslint-disable react/no-array-index-key */
/* eslint-disable no-console */
import React from 'react';
import styled from 'styled-components';
// eslint-disable-next-line import/extensions
import io from 'socket.io-client';
import axios from 'axios';

const chatUrl = 'http://localhost:4000';

const SendTextButton = (props) => {
  const { text, onClick } = props;
  return (
    <div
      className="sendButton"
      style={{ opacity: text === '' ? '0.5' : '1', pointerEvents: text === '' ? 'none' : 'auto' }}
      onClick={onClick}
    >
      send
    </div>
  );
};

const MsgBox = ({msg, nickInfo}) => {
  // eslint-disable-next-line react/prop-types
  if (typeof (msg.data) === 'string') {
    if (msg.receiver === nickInfo.sender) {
      return (
        <MyMsgContainer>
          <div className="text">{msg.data}</div>
          <div className="name">{msg.sender}</div>
        </MyMsgContainer>
      );
    }
    return (
      <MsgContainer>
        <div className="text">{msg.data}</div>
        <div className="name">{msg.sender}</div>
      </MsgContainer>
    );
  }
  return '';
};

const Index = () => {
  const [nickInfo, setNickInfo] = React.useState({});
  const [socket, setSocket] = React.useState(null); // socket 설정
  const [text, setText] = React.useState(''); // 현재 사용자가 작성 중인 text 메시지
  const [msgs, setMsgs] = React.useState([]); // 이전 대화 정보

  // 기존 대화 불러오기
  React.useEffect(() => {
    // 날짜 기준 제거, 전체 불러오기
    // from, to의 경우 page 접속 시 자신, 대상으로 수정
    axios.get(`${chatUrl}/msgs?from=cli-0&to=cli-1`)
      .then(ans => {
        if(!ans.data.msg) return;
        setMsgs(ans.data.msg);
      })
    // 지금은 임시로 대상 입력을 기다리지만, 실제로는 접속 시 최초에만 불러옴
  }, []);
  
  // socket 형성
  React.useEffect(() => {
    const setSocketPromise = async () => {
      return await io(chatUrl);
    };
    setSocketPromise().then(async (tempSocket) => {
      setSocket(tempSocket);
      const ans = await axios.get(`${chatUrl}/isLogin`); // withCredentials 추가할 것
      // 보안성 생략: isLogin에서 token 제공 후 server에서 token과 nickname 비교
      if(!ans.data) return;
      setNickInfo({...nickInfo, sender: ans.data.nickname});
      
      tempSocket.emit('login', ans.data.nickname);
      console.log(`login: ${ans.data.nickname} `);
    });
  }, []);

  // 메시지 받기
  React.useEffect(() => {
    if (socket !== null) {
      socket.on('chat', (msg) => {
        const tempMsgs = [...msgs];
        tempMsgs.push(msg);
        setMsgs(tempMsgs);
      });
    }
  });

  //메시지 보내기
  const sendTextChat = () => {
    socket.emit('chat', { receiver: nickInfo.receiver, data: text, type: 'text' });
    setText('');
    console.log({ receiver: nickInfo.receiver, data: text, type: 'text' });
  };

  // TODO: 이미지 업로드
  // 업로드 완료 시 socket으로 image emit

  return (
    <Background>
      <SignBox>
        <input className="box" value={nickInfo.receiver} onChange={e => {
          setNickInfo({...nickInfo, receiver: e.target.value});
        }}/>
        write target
      </SignBox>
      {
        msgs.map((msg, idx) => (
          <MsgBox key={idx} msg={msg} nickInfo={nickInfo} />
        ))
      }
      <input type="text" onChange={(e) => setText(e.target.value)} value={text} />
      <SendTextButton text={text} onClick={() => { sendTextChat(); }} />
    </Background>
  );
};

const Background = styled.div`
  position: relative;
  left: 50%; transform: translate(-50%, 0%);
  width: 100%; max-width: 24rem;
  height: 48rem;
  background-color: #000;
  display: flex;
  flex-direction: column;
  border: 2px solid #fff;
  input {
    position: fixed;
    bottom: 0.5rem;
    left: 0.5rem;
    background-color: transparent;
    border: 2px solid #fff;
    border-radius: 1rem;
    outline: none;
    padding: 0.5rem 0rem;
    text-align: left;
    width: calc(100% - 5rem);
    color: #ffffff;
    font-size: 1rem;
    height: 1rem;
    text-indent: 0.5rem;
  }
  .sendButton {
    position: fixed;
    bottom: 0.5rem;
    right: 0.5rem;
    background-color: transparent;
    border: 2px solid #fff;
    border-radius: 0.5rem;
    outline: none;
    text-align: center;
    width: 3rem;
    color: #ffffff;
    font-size: 1rem;
    height: 1rem;
    padding-top: 0.4rem;
    padding-bottom: 0.6rem;
    cursor: pointer;
  }
`;

const MsgContainer = styled.div`
  position: relative;
  width:100%;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  height:2rem;
  display: flex;
  flex-direction: row;
  .name {
    position: relative;
    left: 1.5rem;
    width: auto;
    height: 1rem;
    background-color: transparent;
    text-align: right;
    font-style: italic;
    color: #ffffff;
    font-size: 0.8rem;
    margin: 1rem 0rem;
  }
  .text {
    position: fixed;
    right: 0.5rem;
    background-color: transparent;
    border: 2px solid #fff;
    border-radius: 1rem;
    outline: none;
    padding-top: 0.4rem;
    padding-bottom: 0.6rem;
    text-align: left;
    width: calc(100% - 7rem);
    color: #ffffff;
    font-size: 1rem;
    height: 1rem;
    text-indent: 0.5rem;
    overflow: auto;
  }
`;

const MyMsgContainer = styled.div`
  position: relative;
  width:100%;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  height:2rem;
  display: flex;
  flex-direction: row;
  .name {
    position:fixed;
    right: 1.5rem;
    width: auto;
    height: 1rem;
    background-color: transparent;
    text-align: right;
    font-style: italic;
    color: #ffffff;
    font-size: 0.8rem;
    margin: 1rem 0rem;
  }
  .text {
    position: relative;
    left: 0.5rem;
    background-color: transparent;
    border: 2px solid #fff;
    border-radius: 1rem;
    outline: none;
    padding-top: 0.4rem;
    padding-bottom: 0.6rem;
    text-align: left;
    width: calc(100% - 7rem);
    color: #ffffff;
    font-size: 1rem;
    height: 1rem;
    text-indent: 0.5rem;
    overflow: auto;
  }
`;

const SignBox = styled.div`
  position: relative;
  width:100%;
  height: 2.5rem;
  display: flex;
  flex-direction: row;
  margin: 0.5rem 0rem;
  color: white;
  .box {
    position: relative;
    background-color: transparent;
    border: 2px solid #fff;
    border-radius: 1rem;
    outline: none;
    padding-top: 0.4rem;
    padding-bottom: 0.6rem;
    text-align: center;
    width: calc(50% - 2rem);
    color: #ffffff;
    font-size: 1rem;
    height: 1.5rem;
    margin: 0rem 2rem;
    padding-top:0.5rem;
    cursor: pointer;
  }
`;

export default Index;
