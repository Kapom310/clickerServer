const WebSocket = require("ws")

const port = process.env.PORT || 4000

const wss = new WebSocket.Server({ port })

let counter = 0
let playerCount = 0
const REQUIRED_PLAYERS = 5

function broadcast(data) {
    const msg = JSON.stringify(data)

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(msg)
        }
    })
}

function broadcastCounter() {
    broadcast({
        type: "counter",
        value: counter
    })
}

function broadcastStatus() {
    broadcast({
        type: "status",
        players: playerCount,
        required: REQUIRED_PLAYERS,
        ready: playerCount >= REQUIRED_PLAYERS
    })
}

wss.on("connection", (ws) => {

    playerCount++
    console.log("client connected:", playerCount)

    ws.send(JSON.stringify({
        type: "init",
        counter: counter,
        players: playerCount,
        required: REQUIRED_PLAYERS,
        ready: playerCount >= REQUIRED_PLAYERS
    }))

    broadcastStatus()

    ws.on("message", (data) => {

        const msg = JSON.parse(data)

        if (msg.type === "click") {

            if (playerCount < REQUIRED_PLAYERS) {
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Waiting for more players"
                }))
                return
            }

            counter++
            broadcastCounter()
        }
    })

    ws.on("close", () => {
        playerCount--
        console.log("client disconnected:", playerCount)

        broadcastStatus()
    })
})

console.log("WebSocket server running on port", port)
