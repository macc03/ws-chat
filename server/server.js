const ws = require('nodejs-websocket')
const uuid = require('node-uuid')

// 可以通过不同的code可以表示要后端实现的不同逻辑
const {
  RECEIEVE_MESSAGE,
  SAVE_USER_INFO,
  CLOSE_CONNECTION,
  ADD_USER
} = require('./config')

// 当前聊天室的用户
let chatUsers = []

// 广播通知
const broadcast = (server, info) => {
  server.connections.forEach(function (conn) {
    conn.sendText(JSON.stringify(info))
  })
}

// 服务端获取到某个用户的信息通知到所有用户
const broadcastInfo = (server, info) => {
  let count = server.connections.length
  let result = {
    code: RECEIEVE_MESSAGE,
    count: count,
    ...info
  }
  broadcast(server, result)
}

// 新用户
const registerUser = (server, user) => {
  chatUsers.push({username: user.user})
  console.log(chatUsers)
  broadcast(server, user)
}

// 返回当前剩余的在线用户
const sendChatUsers = (server, user) => {
  let chatIds = chatUsers.map(item => item.user)
  if (chatIds.indexOf(user.user) === -1) {
    chatUsers.push(user)
  }
  let result = {
    code: SAVE_USER_INFO,
    count: chatUsers.length,
    chatUsers: chatUsers
  }
  // console.log(result)
  broadcast(server, result)
}

// 触发关闭连接，在离开页面或者关闭页面时，需要主动触发关闭连接
const handleCloseConnect = (server, user) => {
  chatUsers = chatUsers.filter(item => item.chatId !== user.chatId)
  let result = {
    code: CLOSE_CONNECTION,
    count: chatUsers.length,
    chatUsers: chatUsers
  }
  console.log('handleCloseConnect', user)
  broadcast(server, result)
}

// 创建websocket服务
const createServer = () => {
  let server = ws.createServer(connection => {
    connection.on('text', function (result) {
      let info = JSON.parse(result)
      let code = info.code
      if (code === CLOSE_CONNECTION) {
        handleCloseConnect(server, info)
        // 某些情况如果客户端多次触发连接关闭，会导致connection.close()出现异常，这里try/catch一下
        try {
          broadcast(server, info)
          connection.close()
        } catch (error) {
          console.log('close异常', error)
        }
      } else if (code === SAVE_USER_INFO) {
        sendChatUsers(server, info)
      } else if (code === ADD_USER) {
        registerUser(server, info)
      }
      else {
        broadcastInfo(server, info)
      }
    })
    connection.on("binary", function (inStream) {
      // Empty buffer for collecting binary data
      var data = Buffer.alloc(0)
      // Read chunks of binary data and add to the buffer
      inStream.on("readable", function () {
        var newData = inStream.read()
        if (newData)
          data = Buffer.concat([data, newData], data.length + newData.length)
      })
      inStream.on("end", function () {
        console.log("Received " + data.length + " bytes of binary data")
        broadcast(server, data)
      })
    })
    connection.on('connection', function (code) {
      console.log(123)
    })
    connection.on('close', function (code) {
      console.log('关闭连接', code)
    })
    connection.on('error', function (code) {
      // 某些情况如果客户端多次触发连接关闭，会导致connection.close()出现异常，这里try/catch一下
      try {
        connection.close()
      } catch (error) {
        console.log('close异常', error)
      }
      console.log('异常关闭', code)
    })
  })
  // 所有连接释放时，清空聊天室用户
  server.on('close', () => {
    chatUsers = []
  })
  return server
}

createServer().listen(8001)
