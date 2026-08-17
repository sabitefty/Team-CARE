#include <ESP8266WiFi.h>
#include <ESP8266mDNS.h>
#include <ESP8266WebServer.h>


#define DEBUG_SERIAL 1

const char* ssid     = "SubZero";
const char* password = "123456788";

// ===== mDNS HOSTNAME =====
// Device will be reachable at http://esp8266home.local
const char* MDNS_HOSTNAME = "esp8266home";

// ===== RELAY PINS (NodeMCU labeling) =====
#define LIGHT_RELAY_PIN 5   // D1 (GPIO5)
#define FAN_RELAY_PIN   4   // D2 (GPIO4)

#define RELAY_ACTIVE_LOW 1

#if RELAY_ACTIVE_LOW
  #define RELAY_ON_LEVEL  LOW
  #define RELAY_OFF_LEVEL HIGH
#else
  #define RELAY_ON_LEVEL  HIGH
  #define RELAY_OFF_LEVEL LOW
#endif

ESP8266WebServer server(80);

bool lightState = false;
bool fanState   = false;

unsigned long lastWiFiAttempt = 0;
const unsigned long WiFiRetryInterval = 10000;

// ---------------------------------------------------------
// Relay helpers
// ---------------------------------------------------------
void setLight(bool on) {
  lightState = on;
  digitalWrite(LIGHT_RELAY_PIN, on ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL);
  #if DEBUG_SERIAL
  Serial.print("[RELAY] Light -> ");
  Serial.println(on ? "ON" : "OFF");
  #endif
}

void setFan(bool on) {
  fanState = on;
  digitalWrite(FAN_RELAY_PIN, on ? RELAY_ON_LEVEL : RELAY_OFF_LEVEL);
  #if DEBUG_SERIAL
  Serial.print("[RELAY] Fan -> ");
  Serial.println(on ? "ON" : "OFF");
  #endif
}

// ---------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------
void handleControl() {
  if (!server.hasArg("device") || !server.hasArg("state")) {
    server.send(400, "text/plain", "Missing device or state param");
    return;
  }

  String device = server.arg("device");
  String state  = server.arg("state");
  state.toUpperCase();
  bool turnOn = (state == "ON");

  #if DEBUG_SERIAL
  Serial.print("[HTTP] /control  device=");
  Serial.print(device);
  Serial.print("  state=");
  Serial.println(state);
  #endif

  if (device == "light") {
    setLight(turnOn);
  } else if (device == "fan") {
    setFan(turnOn);
  } else {
    server.send(404, "text/plain", "Unknown device: " + device);
    return;
  }

  server.send(200, "text/plain", "OK");
}

void handlePing() {
  server.send(200, "text/plain", "pong");
}

void handleRoot() {
  String html = "<html><body style='font-family:sans-serif'>";
  html += "<h2>VoiceEye ESP8266 Relay Controller</h2>";
  html += "<p>Light: <b>" + String(lightState ? "ON" : "OFF") + "</b></p>";
  html += "<p>Fan: <b>" + String(fanState ? "ON" : "OFF") + "</b></p>";
  html += "<p>IP: " + WiFi.localIP().toString() + "</p>";
  html += "<p>mDNS: http://" + String(MDNS_HOSTNAME) + ".local</p>";
  html += "</body></html>";
  server.send(200, "text/html", html);
}

void handleNotFound() {
  server.send(404, "text/plain", "Not found");
}

// ---------------------------------------------------------
// WiFi + mDNS setup
// ---------------------------------------------------------
void connectWiFi() {
  Serial.print("[WiFi] Connecting to ");
  Serial.print(ssid);
  WiFi.mode(WIFI_STA);
  WiFi.hostname(MDNS_HOSTNAME);
  WiFi.begin(ssid, password);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(300);
    Serial.print(".");
  }
  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("[WiFi] Connected! IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("[WiFi] Failed to connect (will keep retrying in loop)");
  }
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println();
  Serial.println("========================================");
  Serial.println(" ESP8266 RELAY CONTROLLER BOOT");
  Serial.println("========================================");
  Serial.printf(" Light relay pin: D1 (GPIO%d)\n", LIGHT_RELAY_PIN);
  Serial.printf(" Fan relay pin:   D2 (GPIO%d)\n", FAN_RELAY_PIN);
  Serial.printf(" Relay logic:     %s\n", RELAY_ACTIVE_LOW ? "ACTIVE-LOW" : "ACTIVE-HIGH");
  Serial.println("========================================");

  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  // Force both relays OFF at boot (important - avoids devices
  // turning on unexpectedly on power-up/reset).
  setLight(false);
  setFan(false);

  connectWiFi();

  if (MDNS.begin(MDNS_HOSTNAME)) {
    Serial.print("[mDNS] Started: http://");
    Serial.print(MDNS_HOSTNAME);
    Serial.println(".local");
    MDNS.addService("http", "tcp", 80);
  } else {
    Serial.println("[mDNS] Failed to start (use IP address instead)");
  }

  server.on("/control", HTTP_GET, handleControl);
  server.on("/ping", HTTP_GET, handlePing);
  server.on("/", HTTP_GET, handleRoot);
  server.onNotFound(handleNotFound);
  server.begin();

  Serial.println("========================================");
  Serial.println(" HTTP server started on port 80");
  Serial.println(" Endpoints:");
  Serial.println("   GET /control?device=light&state=ON|OFF");
  Serial.println("   GET /control?device=fan&state=ON|OFF");
  Serial.println("   GET /ping");
  Serial.println("========================================");
}

void loop() {
  // ----- Non-blocking WiFi reconnection -----
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWiFiAttempt >= WiFiRetryInterval) {
      Serial.println("[WiFi] Reconnecting...");
      WiFi.reconnect();
      lastWiFiAttempt = millis();
    }
  }

  MDNS.update();
  server.handleClient();
}
