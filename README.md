# STM32 IMU 실시간 텔레메트리 대시보드

**STM32에서 Wi-Fi로 올라오는 가속도·자이로(IMU) 데이터를, 브라우저에서 실시간 차트로 보여주는 대시보드.**

> 디바이스 → 네트워크 → 화면으로 이어지는 임베디드 파이프라인의 **‘수신·시각화’ 측**입니다. STM32가 Wi-Fi로 MQTT 브로커에 IMU JSON을 발행하면, 이 React 앱이 WebSocket으로 구독해 실시간 라인차트로 그립니다. 센서·펌웨어(디바이스)부터 실시간 웹 시각화(화면)까지, 임베디드 × 웹 풀스택을 혼자 배포한 증거의 화면 측입니다.

---

## 무엇을 하나

- **MQTT(over WebSocket) 구독** → IMU JSON 수신 → **recharts 실시간 라인차트** 2종
  - 가속도 3축 `ax·ay·az` (g)
  - 자이로 3축 `gx·gy·gz` (°/s)
- **자동 재연결**과 **연결 상태 표시**(connecting / connected / reconnecting / offline / error)
- 최근 **300 포인트 롤링 윈도우**로 부드러운 실시간 갱신
- **페이로드 유연 파싱** — 실수형 `{ax, ay, az, gx, gy, gz}`뿐 아니라, 펌웨어가 정수로 보내는 스케일 형식 `{ax_mg, gx_cds}`(밀리-g, 센티-°/s)도 자동 환산. 임베디드 쪽 대역폭·정수 전송 사정을 배려한 설계.

## 파이프라인에서의 위치

```
STM32 (IMU 센서 + Wi-Fi)  ──MQTT──▶  브로커  ──WebSocket──▶  [ 이 대시보드 ]  실시간 시각화
        디바이스                     네트워크                    화면 (React)
```

디바이스·네트워크·화면 풀스택 중 **화면 측**입니다. (펌웨어 측은 별도 레포·환경)

## 실행

```bash
npm install
# 아래 .env 설정 후
npm run dev        # 개발 서버 (Vite)
npm run build      # 배포 빌드
```

## 설정 (.env)

브로커 주소·인증·토픽은 환경변수로 주입합니다(코드에 자격증명 하드코딩 없음).

```bash
VITE_MQTT_URL=wss://broker.example.com:8084/mqtt   # MQTT over WebSocket(WSS)
VITE_MQTT_USER=your_user
VITE_MQTT_PASS=your_pass
VITE_MQTT_TOPIC=jaeoh/imu                           # 구독 토픽 (기본값 jaeoh/imu)
```

## 수신 페이로드 형식

브로커로 발행되는 메시지는 JSON 한 줄입니다. 두 형식 모두 받습니다.

```json
{ "ax": 0.01, "ay": -0.02, "az": 1.00, "gx": 0.5, "gy": -0.3, "gz": 0.0 }
```
```json
{ "ax_mg": 10, "ay_mg": -20, "az_mg": 1000, "gx_cds": 50, "gy_cds": -30, "gz_cds": 0 }
```
(`_mg` = 밀리-g, `_cds` = 센티-°/s. 대시보드가 각각 ÷1000, ÷100로 환산.)

## 스택

React 18 · Vite 5 · **recharts**(차트) · **mqtt.js**(MQTT v3.1.1 over WebSocket)

## 구성

| 파일 | 역할 |
|------|------|
| `src/mqttClient.js` | MQTT 연결 생성 — WSS·자동 재연결(2s)·keepalive·env 자격증명 |
| `src/App.jsx` | 구독·수신·안전 파싱(정수 스케일 포함)·롤링 버퍼·2종 실시간 차트·연결상태 UI |

---

> 스크린샷: 실제로 실행한 대시보드 화면을 캡처해 이 자리에 넣으면 첫인상이 크게 좋아집니다.
> (예: `docs/screenshot.png` 추가 후 `![dashboard](docs/screenshot.png)`)

---

**이재오** · (주)에이아이컴퍼니 · ceo@aicompany.co.kr · [github.com/aaljo222](https://github.com/aaljo222)
임베디드 · 펌웨어 · 실시간 데이터 · 웹 시각화 — 디바이스에서 화면까지.
