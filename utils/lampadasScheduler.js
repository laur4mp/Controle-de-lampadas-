const db = require('../db');
const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://127.0.0.1:1883');

client.on('connect', () => {
    console.log('[MQTT CLIENT] Conectado ao broker.');
});

function enviarStatusHorario() {
    db.query('SELECT id, nome, estado, onHorario, offHorario FROM lampadas', (erro, resultado) => {
        if (erro) return console.error('[BD] Erro ao buscar lâmpadas:', erro);
        if (!resultado || resultado.length === 0) return console.log('[BD] Nenhuma lâmpada encontrada');

        resultado.forEach(l => {
            const [onH, onM] = l.onHorario.split(':').map(Number);
            const [offH, offM] = l.offHorario.split(':').map(Number);

            const topico = `lampada/${l.id}/config`; // usa ID
            
            
            const payload = JSON.stringify({
                nome: l.nome,
                estado: l.estado,
                onHorarioH: onH,
                onHorarioM: onM,
                offHorarioH: offH,
                offHorarioM: offM,
                horaAtualH: new Date().getHours(),
                horaAtualM: new Date().getMinutes()
            });

            client.publish(topico, payload);
            console.log(`[MQTT] ${topico} → ${payload}`);
        });
    });
}

setInterval(enviarStatusHorario, 60000); 

// Envia na inicialização
enviarStatusHorario();

module.exports = { enviarStatusHorario };