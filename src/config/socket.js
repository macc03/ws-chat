let socket = new WebSocket('ws:192.168.1.3:8001')

socket.onopen = (e) => {
  console.log('θΏζ₯ζε......')
}

socket.onclose = (e) => {
  if (e.wasClean) {
    console.log(`[close] Connection closed cleanly, code=${e.code}`);
  } else {
    console.log(`[close] Connection died`);
  }
}

export default socket