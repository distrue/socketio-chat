/* eslint-disable react/prop-types */
import * as React from 'react';
import styled from 'styled-components';

export default ({ text, back, backUrl }) => {
  const goBack = () => {
    if (backUrl) {
      window.location.href = backUrl;
    } else {
      window.history.back();
    }
  };
  return (
    <HeaderStyle>
      {text}
      {back ? (
        <img alt="back" src="/static/back.svg" style={{ position: 'absolute', top: '14px', right: '16px', width: '24px', height: '24px' }} onClick={goBack} />
      ) : (
        ''
      )}
    </HeaderStyle>
  );
};

const HeaderStyle = styled.div`
  position: absolute;
  top: 0px;
  left: 50%;
  width: 100%;
  height: 28px;
  background-color: #ffffff;
  z-index: 1;
  transform: translate(-50%, 0%);
  padding-top: 24px;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.16);
  font-family: 'Noto Sans KR';
  font-size: 16px;
  font-weight: normal;
  font-stretch: normal;
  font-style: normal;
  line-height: 0.75;
  letter-spacing: normal;
  text-align: center;
  color: #2b2d30;
`;
