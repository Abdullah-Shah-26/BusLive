#include <Arduino.h>
#if defined(ESP32)
  #include <WiFi.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif

#include <Firebase_ESP_Client.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

#define FIREBASE_HOST "https://buslive-test-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"

#define BUS_ID "bus1"

#define RX_PIN 16
#define TX_PIN 17
#define GPS_BAUD_RATE 9600

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

TinyGPSPlus gps;
SoftwareSerial ss(RX_PIN, TX_PIN);

unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 5000;

void setup() {
  Serial.begin(115200);
  ss.begin(GPS_BAUD_RATE);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("------------------------------------");
  Serial.println("BusLive GPS Tracker Initialized");
  Serial.println("------------------------------------");
}

void loop() {
  while (ss.available() > 0) {
    gps.encode(ss.read());
  }

  if (millis() - lastUpdateTime > UPDATE_INTERVAL) {
    lastUpdateTime = millis();

    if (gps.location.isValid() && gps.location.isUpdated()) {
      float latitude = gps.location.lat();
      float longitude = gps.location.lng();
      float speed = gps.speed.kmph();

      Serial.printf("Updating Firebase for %s\n", BUS_ID);
      Serial.printf("Lat: %f, Lng: %f, Speed: %.2f km/h\n", latitude, longitude, speed);

      FirebaseJson json;
      json.set("lat", latitude);
      json.set("lng", longitude);

      String path = String(BUS_ID) + "/location";
      
      if (Firebase.setJSON(fbdo, path.c_str(), json)) {
        Serial.println("Firebase update successful.");
      } else {
        Serial.println("Firebase update failed.");
        Serial.println("REASON: " + fbdo.errorReason());
      }

      Firebase.setFloat(fbdo, String(BUS_ID) + "/speed", speed);
      Firebase.setString(fbdo, String(BUS_ID) + "/status", "enroute");

    } else {
      Serial.println("Waiting for valid GPS data...");
    }
  }
}
