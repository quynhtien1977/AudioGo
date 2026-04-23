import * as signalR from "@microsoft/signalr"

// ⚠️ Hub mount tại /deviceHub — KHÔNG dùng VITE_API_URL vì nó có /api suffix
// VITE_API_URL = http://localhost:5086/api  →  base = http://localhost:5086
const _apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:5086"
const _hubBase = _apiBase.replace(/\/api$/, "") // strip trailing /api nếu có
const SIGNALR_URL = `${_hubBase}/deviceHub`

class SignalRService {
  constructor() {
    this.connection = null
    this.isConnecting = false
    this.retryTimeout = null
    this.listenerHandlers = new Map() // Track registered handlers to prevent duplicates
    this.listeners = {
      onDeviceOnline: [],
      onDeviceOffline: [],
      onLocationUpdated: [],
      onConnectionStatusChanged: [],
    }
  }

  // ✅ CONNECT TO SIGNALR HUB
  async connect() {
    // ❌ PREVENT MULTIPLE SIMULTANEOUS CONNECTION ATTEMPTS
    if (this.isConnecting) {
      console.log("⏳ SignalR connection already in progress...")
      return
    }

    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      console.log("✅ SignalR already connected")
      return
    }

    // ❌ CLEANUP OLD FAILED CONNECTION
    if (this.connection) {
      const state = this.connection.state
      // Only stop if not already disconnected
      if (state !== signalR.HubConnectionState.Disconnected) {
        try {
          await this.connection.stop()
        } catch (e) {
          console.log("⚠️ Failed to stop old connection:", e.message)
        }
      }
      this.connection = null
    }

    try {
      this.isConnecting = true
      const token = localStorage.getItem("token") || sessionStorage.getItem("token")

      // ⚠️ CHECK IF TOKEN EXISTS
      if (!token) {
        throw new Error("No authentication token found. User may not be logged in.")
      }

      // Small delay to ensure old connection is fully cleaned up
      await new Promise(resolve => setTimeout(resolve, 100))

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(SIGNALR_URL, {
          accessTokenFactory: () => token,
          // ❌ KHÔNG dùng skipNegotiation=true với browser — cần negotiate để truyền token
          // skipNegotiation: true,
          // transport: signalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect([1000, 3000, 5000, 10000])
        .withHubProtocol(new signalR.JsonHubProtocol())
        .build()

      // 🟢 DEVICE ONLINE EVENT - WITH ERROR HANDLING
      const onDeviceOnlineHandler = (device) => {
        try {
          console.log("✅ Device Online:", device)
          this.listeners.onDeviceOnline.forEach((cb) => {
            try {
              cb(device)
            } catch (cbErr) {
              console.error("❌ Error in onDeviceOnline callback:", cbErr)
            }
          })
        } catch (err) {
          console.error("❌ Error handling DeviceOnline event:", err)
        }
      }
      this.connection.on("DeviceOnline", onDeviceOnlineHandler)
      this.listenerHandlers.set("DeviceOnline", onDeviceOnlineHandler)

      // 🔴 DEVICE OFFLINE EVENT - WITH ERROR HANDLING
      const onDeviceOfflineHandler = (device) => {
        try {
          console.log("❌ Device Offline:", device)
          this.listeners.onDeviceOffline.forEach((cb) => {
            try {
              cb(device)
            } catch (cbErr) {
              console.error("❌ Error in onDeviceOffline callback:", cbErr)
            }
          })
        } catch (err) {
          console.error("❌ Error handling DeviceOffline event:", err)
        }
      }
      this.connection.on("DeviceOffline", onDeviceOfflineHandler)
      this.listenerHandlers.set("DeviceOffline", onDeviceOfflineHandler)

      // 📍 LOCATION UPDATE EVENT - WITH ERROR HANDLING
      const onLocationUpdatedHandler = (location) => {
        try {
          console.log("📍 Location Updated:", location)
          this.listeners.onLocationUpdated.forEach((cb) => {
            try {
              cb(location)
            } catch (cbErr) {
              console.error("❌ Error in onLocationUpdated callback:", cbErr)
            }
          })
        } catch (err) {
          console.error("❌ Error handling LocationUpdated event:", err)
        }
      }
      this.connection.on("LocationUpdated", onLocationUpdatedHandler)
      this.listenerHandlers.set("LocationUpdated", onLocationUpdatedHandler)

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
      this.isConnecting = false
      this.listeners.onConnectionStatusChanged.forEach((cb) => cb("connected"))

    } catch (err) {
      console.error("❌ SignalR Connection failed:", err.message)
      this.isConnecting = false
      this.listeners.onConnectionStatusChanged.forEach((cb) => cb("disconnected"))
      
      // ❌ THOROUGHLY CLEANUP FAILED CONNECTION
      if (this.connection) {
        try {
          const state = this.connection.state
          if (state !== signalR.HubConnectionState.Disconnected) {
            await this.connection.stop()
          }
        } catch (stopErr) {
          console.log("⚠️ Failed to stop failed connection:", stopErr.message)
        }
        this.connection = null
      }
      
      // ❌ CANCEL PREVIOUS RETRY IF EXISTS
      if (this.retryTimeout) {
        clearTimeout(this.retryTimeout)
      }
      
      // RETRY AFTER 5s
      this.retryTimeout = setTimeout(() => this.connect(), 5000)
    }
  }

  // ✅ DISCONNECT - CLEAN UP LISTENERS & HANDLERS
  async disconnect() {
    // ❌ CANCEL PENDING RETRY
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
      this.retryTimeout = null
    }

    this.isConnecting = false

    if (this.connection) {
      try {
        // ✅ ONLY STOP IF CONNECTED OR RECONNECTING
        if (this.connection.state !== signalR.HubConnectionState.Disconnected) {
          await this.connection.stop()
        }
        console.log("✅ SignalR Disconnected!")
      } catch (err) {
        console.error("❌ SignalR Disconnect Error:", err)
      } finally {
        this.connection = null
        // 🧹 CLEAR LISTENER HANDLERS TO PREVENT MEMORY LEAK
        this.listenerHandlers.clear()
      }
    }
    
    // 🧹 CLEAR LISTENER CALLBACKS
    this.listeners = {
      onDeviceOnline: [],
      onDeviceOffline: [],
      onLocationUpdated: [],
      onConnectionStatusChanged: [],
    }
  }

  // ✅ SUBSCRIBE TO EVENTS - WITH VALIDATION
  subscribe(eventType, callback) {
    if (!this.listeners.hasOwnProperty(eventType)) {
      console.warn(`⚠️ Invalid event type: ${eventType}`)
      return () => {} // Return empty unsubscribe to prevent errors
    }

    if (typeof callback !== "function") {
      console.warn(`⚠️ Callback must be a function for ${eventType}`)
      return () => {}
    }

    this.listeners[eventType].push(callback)
    
    // Return unsubscribe function
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback)
    }
  }

  // ✅ GET CONNECTION STATUS - ACCURATE STATES
  getStatus() {
    if (!this.connection) return "disconnected"
    
    const state = this.connection.state
    switch (state) {
      case signalR.HubConnectionState.Connected:
        return "connected"
      case signalR.HubConnectionState.Connecting:
        return "connecting"
      case signalR.HubConnectionState.Reconnecting:
        return "reconnecting"
      case signalR.HubConnectionState.Disconnected:
        return "disconnected"
      default:
        return "unknown"
    }
  }
}

// ✅ EXPORT SINGLETON INSTANCE
export const signalRService = new SignalRService()
