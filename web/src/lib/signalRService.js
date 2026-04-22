import * as signalR from "@microsoft/signalr"

const SIGNALR_URL = "http://localhost:5086/deviceHub"

class SignalRService {
  constructor() {
    this.connection = null
    this.listeners = {
      onDeviceOnline: [],
      onDeviceOffline: [],
      onConnectionStatusChanged: [],
    }
  }

  // ✅ CONNECT TO SIGNALR HUB
  async connect() {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("✅ SignalR already connected")
      return
    }

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([1000, 3000, 5000, 10000]) // ✅ Reduce retry attempts
        .withHubProtocol(new signalR.JsonHubProtocol())
        .build()

      // 🟢 DEVICE ONLINE EVENT
      this.connection.on("DeviceOnline", (device) => {
        console.log("✅ Device Online:", device)
        this.listeners.onDeviceOnline.forEach((cb) => cb(device))
      })

      // 🔴 DEVICE OFFLINE EVENT
      this.connection.on("DeviceOffline", (device) => {
        console.log("❌ Device Offline:", device)
        this.listeners.onDeviceOffline.forEach((cb) => cb(device))
      })

      // Connection state events
      this.connection.onreconnecting(() => {
        console.log("🔄 SignalR: Reconnecting...")
        this.listeners.onConnectionStatusChanged.forEach((cb) => cb("reconnecting"))
      })

      this.connection.onreconnected(() => {
        console.log("✅ SignalR: Reconnected successfully!")
        this.listeners.onConnectionStatusChanged.forEach((cb) => cb("connected"))
      })

      this.connection.onclose(() => {
        console.log("❌ SignalR: Disconnected")
        this.listeners.onConnectionStatusChanged.forEach((cb) => cb("disconnected"))
      })

      await this.connection.start()
      console.log("✅ SignalR: Connected (listening for mobile device events)")
      this.listeners.onConnectionStatusChanged.forEach((cb) => cb("connected"))

    } catch (err) {
      console.error("❌ SignalR Connection failed:", err.message)
      this.listeners.onConnectionStatusChanged.forEach((cb) => cb("disconnected"))
      // Retry after 5s
      setTimeout(() => this.connect(), 5000)
    }
  }

  // ✅ DISCONNECT
  async disconnect() {
    if (this.connection) {
      try {
        await this.connection.stop()
        console.log("✅ SignalR Disconnected!")
      } catch (err) {
        console.error("❌ SignalR Disconnect Error:", err)
      }
    }
  }

  // ✅ SUBSCRIBE TO EVENTS
  subscribe(eventType, callback) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].push(callback)
      return () => {
        // Unsubscribe function
        this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback)
      }
    }
  }

  // ✅ GET CONNECTION STATUS
  getStatus() {
    if (!this.connection) return "disconnected"
    return this.connection.state === signalR.HubConnectionState.Connected
      ? "connected"
      : "disconnecting"
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const signalRService = new SignalRService()
