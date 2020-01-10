import React, { useState } from 'react';
import styled from 'styled-components';
import Router from 'next/router';
import axios from 'axios';
import io from 'socket.io-client';
import { Header, MobileWrapper } from '../components';

// URL 설정
const backUrl = 'http://localhost:4000';
const chatUrl = 'http://localhost:5000';

// components
const Input = (props) => (
  <InputContainer value={props.value}>
    <div className='container'>
      <div className='plusButton'>
        <div className='text'>+</div>
      </div>
      <input type='text' onChange={(e) => props.onChange(e.target.value)} value={props.value} />
      <div className='sendButton' onClick={() => props.onClick()}>
        <div className='text'>전송</div>
      </div>
    </div>
  </InputContainer>
);

const MsgBox = ({ msg, chatInfo, profileImage }) => {
  // eslint-disable-next-line react/prop-types
  if (msg.type === 'text') {
    if (msg.receiver === chatInfo.sender) {
      return (
        <SendedMsgContainer>
          <div className='triContainer'>
            <img className='shadowTri' alt="triangle" src='/static/greenTri.png' />
            <img className='tri' alt="triangle" src='/static/greenTri.png' />
          </div>
          <div className='msgBox'>{msg.data}</div>
        </SendedMsgContainer>
      );
    }
    return (
      <ReceivedMsgContainer>
        <div className='profile'>
          <label htmlFor='profileImage'>
            <img alt="pf" src={profileImage || '/static/profileimg.png'} />
          </label>
        </div>
        <div className='triContainer'>
          <img className='shadowTri' alt="triangle" src='/static/greyTri.png' />
          <img className='tri' alt="triangle" src='/static/greyTri.png' />
        </div>
        <div className='msgBox'>{msg.data}</div>
      </ReceivedMsgContainer>
    );
  }
  return '';
};

const Index = () => {
  const [chatInfo, setChatInfo] = React.useState({});
  const [socket, setSocket] = React.useState(null); // socket 설정
  const [text, setText] = React.useState(''); // 현재 사용자가 작성 중인 text 메시지
  const [msgs, setMsgs] = React.useState([]); // 이전 대화 정보
  const [profileImage, setProfileImg] = React.useState('');

  // 기존 대화 불러오기
  React.useEffect(() => {
    // 날짜 기준 제거, 전체 불러오기
    // from, to의 경우 page 접속 시 자신, 대상으로 수정
    axios.get(`${backUrl}/msgs?from=cli-0&to=cli-1`)
      .then(ans => {
        if (!ans.data.msg) return;
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
      const ans = await axios.get(`${backUrl}/isLogin`); // withCredentials 추가할 것
      // 보안성 생략: isLogin에서 token 제공 후 server에서 token과 nickname 비교
      if (!ans.data) return;
      setChatInfo({ ...chatInfo, sender: ans.data.id });

      tempSocket.emit('login', ans.data.id);
      console.log(`login: ${ans.data.id} `);
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
    socket.emit('chat', { receiver: chatInfo.receiver, data: text, type: 'text', date: new Date() });
    setText('');
    console.log({ receiver: chatInfo.receiver, data: text, type: 'text', date: new Date() });
  };

  // TODO: 이미지 업로드
  // 업로드 완료 시 socket으로 image emit

  return (
    <MobileWrapper>
      <Header text={chatInfo.receiver} back backUrl={''} />
      <Main>
        {/* 테스트용 코드 */}
        <input className="box" value={chatInfo.receiver} onChange={e => {
          setChatInfo({ ...chatInfo, receiver: e.target.value });
        }} />
        <button onClick={() => { console.log(msgs) }} />
        <button onClick={() => { console.log(chatInfo) }} />
        {/* 테스트용 코드 끝 */}
        {
          msgs.map((msg, idx) => (
            <MsgBox key={idx} msg={msg} chatInfo={chatInfo} />
          ))
        }
        <Input onChange={setText} value={text} onClick={sendTextChat} />
      </Main>
    </MobileWrapper>
  );
};

export default Index;

const InputContainer = styled.div`
  position: fixed;
  bottom: 0px;
  width: 100%;
  height: 69px;
  box-shadow: 0 -2px 2px 0 rgba(0, 0, 0, 0.16);
  background-color: #ffffff;
  .container {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: row;
    .plusButton {
      position: relative;
      width: 20px;
      height: 20px;
      border-radius: 4px;
      box-shadow: 0 0 3px 0 rgba(0, 0, 0, 0.16);
      background-color: #ffffff;
      margin-left: 15px;
      margin-top: 26px;
      .text {
        position: relative;
        width: 100%;
        margin-top: 3px;
        font-size: 16px;
        text-align: center;
        color: #2b2d30;
      }
    }
    input {
      position: relative;
      margin-left: 12px;
      margin-top: 15px;
      width: calc(100% - 110px);
      height: 40px;
      border-radius: 4px;
      border: solid 0.5px #b0b3bb;
      background-color: #ffffff;
      font-size: 16px;
      text-align: left;
      text-indent: 4px;
      outline: none;
      color: #2b2d30;
    }
    .sendButton {
      position: relative;
      margin-left: 13px;
      margin-top: 28px;
      width: 35px;
      height: 19px;
      font-size: 16px;
      text-align: center;
      color: ${props => props.value === "" ? '#2b2d30;' : '#0d6412'};
      pointer-events: ${props => props.value === "" ? 'none;' : 'all'};
      cursor: pointer;
    }
  }
`
const ReceivedMsgContainer = styled.div`
  position: relative;
  width: 280px;
  height: auto; //
  display: flex;
  flex-direction: row;
  margin-bottom: 23px;
  .profile {
    position: relative;
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background-color: #f4f5fa;
    overflow: hidden;
    margin-left: 16px;
    img {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      max-width: 18px;
      max-height: 18px;
    }
  }
  .triContainer {
    position: relative;
    margin-left: 4px;
    width: 12px;
    height: 6px;
    .shadowTri {
      position:fixed;
      width: 12px;
      height: 6px;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.16));
    }
    .tri {
      position:fixed;
      width: 12px;
      height: 6px;
      z-index: 1;
    }
  }
  .msgBox {
    position: relative;
    margin-left: -2px;
    max-width: 230px;
    height: auto;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.16);
    background-color: #f4f5fa;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.5;
    text-align: left;
    color: #707070;
    padding: 11px 26px 8px 12px;
    border-radius: 3px;
  }
`
const SendedMsgContainer = styled.div`
  position: relative;
  right: 0px;
  height: auto; //
  display: flex;
  flex-direction: row-reverse;
  margin-bottom: 23px;
  .triContainer {
    position: relative;
    margin-right: 18px; 
    width: 12px;
    height: 6px;
    .shadowTri {
      position:fixed;
      width: 12px;
      height: 6px;
      filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.16));
    }
    .tri {
      position:fixed;
      width: 12px;
      height: 6px;
      z-index: 1;
    }
  }
  .msgBox {
    position: relative;
    right: 0px;
    margin-right: -2px;
    max-width: 230px;
    height: auto;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.16);
    background-color: #0d6412;
    font-size: 12px;
    font-weight: 300;
    line-height: 1.5;
    text-align: left;
    color: #ffffff;
    padding: 11px 26px 8px 12px;
    border-radius: 3px;
  }
`

const Main = styled.div`
  position: relative;
  top: 52px;
  width: 100%;
  height: calc(100vh - 121px);
  font-family:  'Noto Sans KR';
  font-size: 16px;
  font-weight: 500;
  font-stretch: normal;
  font-style: normal;
  line-height: 0.75;
  letter-spacing: normal;
  padding-top: 28px;
  .main {
    position: relative;
    top: 0px;
    width: 100%;
    height: 198px;
    overflow: hidden;
    background-color: rgba(0, 0, 0, 0.5);
    img {
      position: absolute;
      top: -52px;
      width: 100%;
      z-index: -1;
    }
  }
  .page {
    position: absolute;
    top: 328px;
    width: 100%;
    height: calc(100vh - 370px);
    overflow: scroll;
  }
`;
