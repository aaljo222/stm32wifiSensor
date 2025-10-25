// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { createMqttClient } from "./mqttClient";

const TOPIC = import.meta.env.VITE_MQTT_TOPIC || "jaeoh/imu";
const MAX_POINTS = 300;

function useImuData() {
  const [status, setStatus] = useState("connecting");
  const [accel, setAccel] = useState([]);
  const [gyro, setGyro] = useState([]);
  const clientRef = useRef(null);

  // src/mqttClient.js는 그대로 두고, src/App.jsx의 useImuData()만 수정
  useEffect(() => {
    const client = createMqttClient({});
    clientRef.current = client;

    const onConnect = () => {
      console.log("[MQTT] connected");
      setStatus("connected"); // ✅ 연결 상태 업데이트
      client.subscribe(TOPIC, { qos: 0 }, (err, granted) => {
        if (err) return console.error("subscribe error:", err);
        console.log(
          "[MQTT] subscribed:",
          granted?.map((g) => g.topic).join(",")
        );
      });
    };

    client.on("connect", onConnect);
    client.on("reconnect", () => setStatus("reconnecting"));
    client.on("close", () => setStatus("closed"));
    client.on("offline", () => setStatus("offline"));
    client.on("error", (e) => {
      console.error(e);
      setStatus("error");
    });

    // ✅ message 핸들러: 원문 로그 + 안전 파싱
    client.on("message", (_topic, payload) => {
      const raw =
        payload instanceof Uint8Array
          ? new TextDecoder("utf-8").decode(payload)
          : String(payload);
      console.log("[RAW]", raw); // ✅ 무조건 원문 찍기

      let msg;
      try {
        msg = JSON.parse(raw.trim()); // ✅ 공백/개행 제거 후 파싱
      } catch (e) {
        console.warn("JSON parse failed:", e, raw);
        return;
      }
      console.log("[RX]", msg); // ✅ 파싱 성공 시만 출력

      const t = new Date().toLocaleTimeString();
      const ax = msg.ax ?? (msg.ax_mg != null ? msg.ax_mg / 1000 : null);
      const ay = msg.ay ?? (msg.ay_mg != null ? msg.ay_mg / 1000 : null);
      const az = msg.az ?? (msg.az_mg != null ? msg.az_mg / 1000 : null);
      const gx = msg.gx ?? (msg.gx_cds != null ? msg.gx_cds / 100 : null);
      const gy = msg.gy ?? (msg.gy_cds != null ? msg.gy_cds / 100 : null);
      const gz = msg.gz ?? (msg.gz_cds != null ? msg.gz_cds / 100 : null);

      if ([ax, ay, az].some((v) => v != null)) {
        setAccel((prev) => {
          const next = [...prev, { t, ax, ay, az }];
          if (next.length > MAX_POINTS) next.shift();
          return next;
        });
      }
      if ([gx, gy, gz].some((v) => v != null)) {
        setGyro((prev) => {
          const next = [...prev, { t, gx, gy, gz }];
          if (next.length > MAX_POINTS) next.shift();
          return next;
        });
      }
    });

    return () => {
      try {
        client.end(true);
      } catch {}
    };
  }, []);

  return { status, accel, gyro };
}

export default function App() {
  const { status, accel, gyro } = useImuData();
  const color = useMemo(
    () =>
      ({
        connecting: "#6b7280",
        connected: "#16a34a",
        reconnecting: "#d97706",
        offline: "#6b7280",
        closed: "#6b7280",
        error: "#dc2626",
      }[status] || "#6b7280"),
    [status]
  );

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>IMU Live Chart</h1>
        <span style={{ ...styles.badge, backgroundColor: color }}>
          {status}
        </span>
        <span style={{ fontSize: 12, opacity: 0.7 }}>
          topic: <code>{TOPIC}</code>
        </span>
      </header>

      <section style={styles.grid}>
        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Accelerometer (g)</h3>
          <Chart
            data={accel}
            series={[
              { dataKey: "ax", name: "ax" },
              { dataKey: "ay", name: "ay" },
              { dataKey: "az", name: "az" },
            ]}
          />
        </div>

        <div style={styles.card}>
          <h3 style={{ marginTop: 0 }}>Gyroscope (°/s)</h3>
          <Chart
            data={gyro}
            series={[
              { dataKey: "gx", name: "gx" },
              { dataKey: "gy", name: "gy" },
              { dataKey: "gz", name: "gz" },
            ]}
          />
        </div>
      </section>

      <footer style={{ opacity: 0.6, fontSize: 12, marginTop: 12 }}>
        MQTT over WebSocket: <code>{import.meta.env.VITE_MQTT_URL}</code>
      </footer>
    </div>
  );
}

function Chart({ data, series }) {
  return (
    <div style={{ height: 360 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 10, right: 24, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="t" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          {series.map((s, i) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name}
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const styles = {
  wrap: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: 16,
    fontFamily: "ui-sans-serif, system-ui, Segoe UI, Roboto",
  },
  header: { display: "flex", alignItems: "center", gap: 12, marginBottom: 12 },
  badge: {
    color: "#fff",
    padding: "2px 8px",
    borderRadius: 999,
    textTransform: "capitalize",
  },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 },
  card: {
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    boxShadow: "0 4px 20px rgba(0,0,0,.06)",
  },
};
