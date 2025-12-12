#include <Wire.h>
#include <RTClib.h>
#include <UIPEthernet.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

RTC_DS3231 rtc;

const int rele1 = 7; // Lâmpada ID 1
const int rele2 = 6; // Lâmpada ID 2

// ETHERNET + MQTT 
byte mac[] = { 0xDE, 0xAD, 0xBE, 0xEF, 0xFE, 0x01 };
IPAddress ipFixo(192, 168, 100, 200); 
IPAddress mqttServer(192, 168, 100, 146); 
IPAddress gateway(192, 168, 100, 1);

EthernetClient ethClient;
PubSubClient mqttClient(ethClient);

// VARIÁVEIS DE HORÁRIO E ESTADO DESEJADO 
int liga1_h = 0, liga1_m = 0, desliga1_h = 0, desliga1_m = 0;
int liga2_h = 0, liga2_m = 0, desliga2_h = 0, desliga2_m = 0;
int estado1 = 0; 
int estado2 = 0;

// VARIÁVEIS DE HORA DO SERVIDOR 
int servidor_h = 0;
int servidor_m = 0;
// Variável para contar quantos segundos se passaram desde da ultima atualização do servidor
unsigned long ultimaHoraServidor = 0; 


///compara hr
bool maiorOuIgual(int h, int m, int refH, int refM) {
    return (h > refH) || (h == refH && m >= refM);
}

//  verifica intervalo (passando meia-noite) 
bool dentroDoIntervalo(int h, int m, int ligH, int ligM, int desH, int desM) {
    if (ligH < desH || (ligH == desH && ligM < desM)) {
        return maiorOuIgual(h, m, ligH, ligM) && !maiorOuIgual(h, m, desH, desM);
    }
    return maiorOuIgual(h, m, ligH, ligM) || !maiorOuIgual(h, m, desH, desM);
}

// publicar estado
void publicarEstado(int id, int estado) {
    String topico = "lampada/" + String(id) + "/estado";
    String payload = String(estado);
    mqttClient.publish(topico.c_str(), payload.c_str());
    Serial.print("[MQTT] Estado publicado ");
    Serial.print(topico);
    Serial.print(": ");
    Serial.println(payload);
}

// escuta mqqt
void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String msg = "";
    for (unsigned int i = 0; i < length; i++) msg += (char)payload[i];

    Serial.print("[MQTT] Mensagem recebida em ");
    Serial.print(topic);
    Serial.print(": ");
    Serial.println(msg);

    // LÓGICA DE CONFIGURAÇÃO (SCHEDULER)
    StaticJsonDocument<500> doc; 
    DeserializationError error = deserializeJson(doc, msg);
    
    if (error) {
        Serial.print("[MQTT] ERRO DE JSON (CONFIG): ");
        Serial.println(error.f_str()); 
        return;
    }
    
    // Leitura dos horários de agendamento
    int estado = doc["estado"].as<int>(); 
    int onH = doc["onHorarioH"];
    int onM = doc["onHorarioM"];
    int offH = doc["offHorarioH"];
    int offM = doc["offHorarioM"];

    // CAMPOS PARA REDUNDÂNCIA
    servidor_h = doc["horaAtualH"]; 
    servidor_m = doc["horaAtualM"]; 
    ultimaHoraServidor = millis(); // Reseta o contador para usar o tempo do servidor

    if (strcmp(topic, "lampada/1/config") == 0) {
        estado1 = estado; 
        liga1_h = onH; liga1_m = onM;
        desliga1_h = offH; desliga1_m = offM;
        Serial.println("[MQTT] Configuração lampada 1 atualizada");
    }
    else if (strcmp(topic, "lampada/2/config") == 0) {
        estado2 = estado; 
        liga2_h = onH; liga2_m = onM;
        desliga2_h = offH; desliga2_m = offM;
        Serial.println("[MQTT] Configuração lampada 2 atualizada");
    }
}

//coneção mqqt
void reconnectMQTT() {
    while (!mqttClient.connected()) {
        Serial.println("[MQTT] Tentando conectar...");
        if (mqttClient.connect("ArduinoMegaClient")) {
            Serial.println("[MQTT] Conectado!");
            // apenas se inscreve nos tópicos de config
            mqttClient.subscribe("lampada/1/config");
            mqttClient.subscribe("lampada/2/config");
        } else {
            Serial.print("[MQTT] Falha rc=");
            Serial.println(mqttClient.state());
            delay(2000);
        }
    }
}

//configuração
void setup() {
    Serial.begin(9600);
    rtc.begin();

    pinMode(rele1, OUTPUT);
    pinMode(rele2, OUTPUT);

    digitalWrite(rele1, LOW);
    digitalWrite(rele2, LOW);

    if (rtc.lostPower()) {
        Serial.println("[RTC] RTC perdeu energia! Setando o horário para o horário da compilação.");
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
    }

    if (Ethernet.begin(mac) == 0) Ethernet.begin(mac, ipFixo, gateway);
    mqttClient.setServer(mqttServer, 1883);
    mqttClient.setCallback(mqttCallback);
}

void loop() {
    if (!mqttClient.connected()) reconnectMQTT();
    mqttClient.loop();
    int h, m;
    
    // logica obter hora, prioridadade rtc
  
    if (rtc.lostPower()) {
        // se RTC parou, usamos a hora do servidor e add 1 min a cada 60 segundos manual
        unsigned long tempoPassado = millis() - ultimaHoraServidor;
        int minutosPassados = tempoPassado / 60000;

        if (minutosPassados > 0) {
            servidor_m += minutosPassados;
            servidor_h += servidor_m / 60;
            servidor_m %= 60;
            servidor_h %= 24;

            ultimaHoraServidor += minutosPassados * 60000; 
            Serial.println("[TIME] usando hora do servidor o RTC falhou).");
        }
        h = servidor_h;
        m = servidor_m;

    } else {
        // Se o RTC estiver funcionando, usamos ele (PRIORIDADE)
        DateTime agora = rtc.now(); 
        h = agora.hour();
        m = agora.minute();
    }
    
    
    //  LÓGICA DE AGENDAMENTO
    bool deveLigar1 = dentroDoIntervalo(h, m, liga1_h, liga1_m, desliga1_h, desliga1_m);
    bool deveLigar2 = dentroDoIntervalo(h, m, liga2_h, liga2_m, desliga2_h, desliga2_m);

    // Lâmpada id 1
    digitalWrite(rele1, deveLigar1 ? HIGH : LOW);

    // Lâmpada id 2
    digitalWrite(rele2, deveLigar2 ? HIGH : LOW);

  // Logs de Debug e Publicação
    static unsigned long lastPub = 0;
    static unsigned long lastDebugPrint = 0;

    if (millis() - lastDebugPrint > 5000) {
        lastDebugPrint = millis();
        Serial.print("[DEBUG] Tempo Usado: ");
        // verifica se o RTC está funcionando
        Serial.print(!rtc.lostPower() ? "RTC" : "SERVIDOR"); 
        Serial.print(" ");
        Serial.print(h);
        Serial.print(":");
        if (m < 10) Serial.print("0");
        Serial.print(m);
        Serial.print(" | Deve Ligar 1: ");
        Serial.println(deveLigar1 ? "SIM" : "NAO");
    }

    if (millis() - lastPub > 5000) {
        lastPub = millis();
        // publica o estado (0 ou 1) no tópico e o node sincroniza no bd
        publicarEstado(1, digitalRead(rele1) == HIGH ? 1 : 0);
        publicarEstado(2, digitalRead(rele2) == HIGH ? 1 : 0);
    }

    delay(1000);
}