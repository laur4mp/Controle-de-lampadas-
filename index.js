console.log("[SERVIDOR] Iniciando...");

const express = require('express');
const cors = require('cors');
const db = require('./db'); 
const mqtt = require('mqtt');
const app = express();

app.use(express.json());
app.use(cors()); 

// rotas http
const usuariosRoutes = require('./routes/usuarios');
const lampadasRoutes = require('./routes/lampadas');

app.use('/usuarios', usuariosRoutes);
app.use('/lampadas', lampadasRoutes);

app.get('/', (req, res) => {
    console.log("[LOG] GET /");
    res.send("Servidor funcionando!");
});

//broker mqtt interno

const aedes = require("aedes")();
const net = require("net");
const MQTT_PORT = 1883;

// Inicializa o servidor que atua como o Broker central.
const mqttServer = net.createServer(aedes.handle);
mqttServer.listen(MQTT_PORT, "0.0.0.0", () => {
    console.log(`[MQTT] Broker interno rodando na porta ${MQTT_PORT}`);
});

// Log de publicações no Broker
aedes.on("publish", (packet, client) => {
    if (client) {
        console.log(`[MQTT] ${client.id} → ${packet.topic}: ${packet.payload}`);
    }
});


//cliente mqqt para o broker interno

const client = mqtt.connect("mqtt://127.0.0.1:1883");

client.on("connect", () => {
    console.log("[MQTT CLIENT] Conectado ao broker interno.");
    // Cliente se inscreve para receber o estado físico real reportado pelo Arduino.
    client.subscribe("lampada/+/estado");
});

//estado da lampada no bd atualizado com o do arduino
client.on("message", (topic, msg) => {
    if (topic.includes("/estado")) {
        const estadoRecebido = parseInt(msg.toString());
        const lampadaId = topic.split('/')[1]; 
    
        console.log(`[SINCRONIZAÇÃO BD] Tópico: ${topic} | Estado recebido: ${estadoRecebido}`);
    
        // Atualiza o MySQL para refletir o estado físico (0 ou 1) do Arduino.
        db.query('UPDATE lampadas SET estado = ? WHERE id = ?', [estadoRecebido, lampadaId], (erro, resultado) => {
            if (erro) {
                console.error(`[BD] Erro ao sincronizar estado da lâmpada ${lampadaId}:`, erro);
            } else if (resultado.affectedRows > 0) {
                console.log(`[BD] Lâmpada ${lampadaId} sincronizada com o estado ${estadoRecebido} (via Arduino).`);
            }
        });
    }
});

// ------------------------------------
// SCHEDULER DE HORÁRIOS
// ------------------------------------
const { enviarStatusHorario } = require('./utils/lampadasScheduler');

// Envia horários agendados e a hora atual (redundância) para o Arduino.
enviarStatusHorario();
setInterval(enviarStatusHorario, 5000); 


//SERVIDOR HTTP
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor HTTP rodando na porta ${PORT}`);
    console.log(`Acesse: http://192.168.1.4:${PORT}/`); 
});