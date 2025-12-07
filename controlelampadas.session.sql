SELECT * from lampadas;
use controlelampadas;

SELECT * FROM usuarios

 ALTER TABLE lampadas ADD UNIQUE (nome);

 DELETE from usuarios WHERE id = 3
 ;
ALTER TABLE lampadas
ADD COLUMN estado VARCHAR(10) NOT NULL;

ALTER Table lampadas estado DEFAULT ' '

UPDATE lampadas SET estado = 'Desligada' WHERE estado = ' ' or estado IS NULL;
ALTER TABLE usuarios ADD COLUMN codigo_recuperacao VARCHAR(6) NULL;
ALTER TABLE usuarios ADD COLUMN data_expiracao_codigo DATETIME NULL;

INSERT INTO lampadas (nome, onHorario, offHorario, estado) VALUES ('Lampada1', '19:30', '23:00', '0');

-- Inserir Lampada2
INSERT INTO lampadas (nome, onHorario, offHorario, estado) VALUES ('Lampada2', '06:00', '23:30', '0');

-- Verificar se foram inseridas
SELECT * FROM lampadas;


