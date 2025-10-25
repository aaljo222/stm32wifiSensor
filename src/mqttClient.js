import mqtt from "mqtt";

const URL = import.meta.env.VITE_MQTT_URL;

export function createMqttClient({
  url = URL,
  clientId = `web-imu-${Math.random().toString(16).slice(2)}`,
} = {}) {
  const client = mqtt.connect(url, {
    protocolVersion: 4, // MQTT v3.1.1
    clean: true,
    keepalive: 60,
    reconnectPeriod: 2000,
    connectTimeout: 30000,
    username: import.meta.env.VITE_MQTT_USER,
    password: import.meta.env.VITE_MQTT_PASS,
  });

  client.on("error", (e) => console.error("[MQTT] error:", e));
  client.on("close", () => console.warn("[MQTT] closed"));
  client.on("reconnect", () => console.log("[MQTT] reconnecting..."));

  return client;
}
