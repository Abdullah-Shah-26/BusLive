/*
 * NaviLoop - Real-Time GPS Tracker for Firebase
 * This sketch is designed for an ESP8266 or ESP32 microcontroller to read GPS data
 * from a NEO-6M module and upload it to a Firebase Realtime Database.
 * 
 * HARDWARE CONNECTIONS:
 * ESP32/ESP8266   |   NEO-6M GPS Module
 * -------------------------------------
 *      VIN        |        VCC
 *      GND        |        GND
 *     RX (GPIO16) |        TX
 *     TX (GPIO17) |        RX
 * 
 * REQUIRED LIBRARIES:
 * 1. TinyGPS++: http://arduiniana.org/libraries/tinygpsplus/
 * 2. Firebase ESP Client: https://github.com/mobizt/Firebase-ESP-Client
 *    - In Arduino IDE, go to Sketch > Include Library > Manage Libraries...
 *    - Search for "TinyGPSPlus" and install it.
 *    - Search for "Firebase ESP Client" and install it.
 */

#include <Arduino.h>
#if defined(ESP32)
  #include <WiFi.h>
#elif defined(ESP8266)
  #include <ESP8266WiFi.h>
#endif

#include <Firebase_ESP_Client.h>
#include <SoftwareSerial.h>
#include <TinyGPS++.h>

// --- USER CONFIGURATION ---

// 1. WiFi Credentials
#define WIFI_SSID "YOUR_WIFI_SSID"
#define WIFI_PASSWORD "YOUR_WIFI_PASSWORD"

// 2. Firebase Project Configuration
// Go to Project Settings > Service accounts > Database secrets
#define FIREBASE_HOST "https://buslive-test-default-rtdb.asia-southeast1.firebasedatabase.app"
#define FIREBASE_AUTH "YOUR_FIREBASE_DATABASE_SECRET"

// 3. Bus ID - This will be the path in your Firebase database
#define BUS_ID "bus1"

// 4. GPS Module Configuration
#define RX_PIN 16 // ESP's RX pin connected to GPS TX pin
#define TX_PIN 17 // ESP's TX pin connected to GPS RX pin
#define GPS_BAUD_RATE 9600

// --- END OF USER CONFIGURATION ---


// Firebase objects
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

// GPS objects
TinyGPSPlus gps;
SoftwareSerial ss(RX_PIN, TX_PIN);

// Timer for non-blocking updates
unsigned long lastUpdateTime = 0;
const unsigned long UPDATE_INTERVAL = 5000; // 5 seconds

void setup() {
  Serial.begin(115200);
  ss.begin(GPS_BAUD_RATE);

  // Connect to WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("Connected with IP: ");
  Serial.println(WiFi.localIP());

  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;

  // Initialize Firebase
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  Serial.println("------------------------------------");
  Serial.println("NaviLoop GPS Tracker Initialized");
  Serial.println("------------------------------------");
}

void loop() {
  // Feed GPS data to TinyGPS++ object
  while (ss.available() > 0) {
    gps.encode(ss.read());
  }

  // Check if it's time to update Firebase
  if (millis() - lastUpdateTime > UPDATE_INTERVAL) {
    lastUpdateTime = millis();

    // Check if we have a valid location from the GPS
    if (gps.location.isValid() && gps.location.isUpdated()) {
      float latitude = gps.location.lat();
      float longitude = gps.location.lng();
      float speed = gps.speed.kmph();

      Serial.printf("Updating Firebase for %s\n", BUS_ID);
      Serial.printf("Lat: %f, Lng: %f, Speed: %.2f km/h\n", latitude, longitude, speed);

      // Create a JSON object to send to Firebase
      FirebaseJson json;
      json.set("lat", latitude);
      json.set("lng", longitude);

      String path = String(BUS_ID) + "/location";
      
      // Update the location data in Firebase
      if (Firebase.setJSON(fbdo, path.c_str(), json)) {
        Serial.println("Firebase update successful.");
      } else {
        Serial.println("Firebase update failed.");
        Serial.println("REASON: " + fbdo.errorReason());
      }

      // Also update speed and status
      Firebase.setFloat(fbdo, String(BUS_ID) + "/speed", speed);
      Firebase.setString(fbdo, String(BUS_ID) + "/status", "enroute");

    } else {
      Serial.println("Waiting for valid GPS data...");
    }
  }
}
