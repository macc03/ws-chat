import { useEffect, useState } from 'react'
import './assets/styles/App.scss'
// import socket from './config/socket'

let socket = new WebSocket('ws:192.168.1.3:8001')
let me

socket.onopen = (e) => {
  console.log('连接成功......')
  while (!me) {
    me = prompt('请输入昵称:')
  }
  sendMessage(`${me}进入房间`, new Date().toLocaleDateString(), 3)
}

socket.onclose = (e) => {
  socket.send(JSON.stringify({ code: 0, message: `${me}退出了房间` }))
  if (e.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${e.code}`);
  } else {
    console.log(`[close] Connection died`);
  }
}

function sendMessage(message, time, code = 1) {
  try {
    if (!message) return;
    socket.send(JSON.stringify({ message, time, code, user: me }))
  } catch (e) {
    alert(e)
  }

}

const MessageItem = ({ user, message, time, code, send = false }) => {

  return (
    code === 1
      ? <>
        <div className='message-item'>
          <div className={`head ${user === me ? 'me': ''}`}>
            <div className="user-pic">{user[0]}</div>
            <span className='username'>{user}</span>
          </div>
          <div className="message-content">
            <p className='message'>{message}</p>
            <p className='message-time'>{time}</p>
          </div>
        </div>
      </>
      : <div>
        <p className='enter-room'>{user}进入房间</p>
      </div>
  )
}

function App() {
  const [message, setMessage] = useState('')
  const [messagelist, setMessagelist] = useState([])

  socket.onmessage = (e) => {
    let { user, message, code, time } = JSON.parse(e.data)
    console.log(e.data)
    setMessagelist([...messagelist, { user, message, time, code }])
  }

  return (
    <div className="App">
      <div className="header"></div>
      <div className="main">
        <h1>聊天室</h1>
        <section id="content">
          {
            messagelist.map((item, index) => <MessageItem key={index} {...item} />)
          }
        </section>
        <div className="textWrapper">
          <input id='text'
            type="text"
            value={message}
            onKeyUp={e => {
              if (e.code === 'Enter') {
                let time = new Date().toLocaleDateString()
                // setMessagelist([...messagelist, { userId: '123', message, time }])
                sendMessage(message, time)
                setMessage('');
              }
            }}
            onChange={e => setMessage(e.target.value)}
          />
          <button id='button' onClick={() => { sendMessage(message, new Date().toLocaleDateString()); setMessage('') }}>发送</button>
        </div>
        <input type="file" name="" id="file" />
      </div>
    </div>
  )
}

export default App
