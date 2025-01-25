const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static('public'));

app.get('/reservas', (req, res) => {
    fs.readFile(path.join(__dirname, 'reservas.csv'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }
        res.send(data);
    });
});

app.post('/reservas', (req, res) => {
    const { startDate, endDate, nombre, apellido } = req.body;
    let cabana = '1';
    const newReservation = `${startDate},${endDate},${nombre},${apellido},${cabana}\n`;

    fs.readFile(path.join(__dirname, 'reservas.csv'), 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading file');
            return;
        }

        const reservations = data.split('\n').slice(1).map(line => {
            const [startDate, endDate, nombre, apellido, cabana] = line.split(',');
            return { startDate, endDate, nombre, apellido, cabana };
        });

        const isAvailable = (startDate, endDate, cabana) => {
            for (const reservation of reservations) {
                if (reservation.cabana === cabana) {
                    const resStartDate = new Date(reservation.startDate);
                    const resEndDate = new Date(reservation.endDate);
                    const reqStartDate = new Date(startDate);
                    const reqEndDate = new Date(endDate);
                    if ((reqStartDate >= resStartDate && reqStartDate <= resEndDate) ||
                        (reqEndDate >= resStartDate && reqEndDate <= resEndDate) ||
                        (reqStartDate <= resStartDate && reqEndDate >= resEndDate)) {
                        return false;
                    }
                }
            }
            return true;
        };

        if (!isAvailable(startDate, endDate, '1')) {
            if (isAvailable(startDate, endDate, '2')) {
                cabana = '2';
            } else {
                res.status(400).send('No hay disponibilidad para las fechas seleccionadas.');
                return;
            }
        }

        const updatedCsv = data + newReservation;

        fs.writeFile(path.join(__dirname, 'reservas.csv'), updatedCsv, (err) => {
            if (err) {
                res.status(500).send('Error writing file');
                return;
            }
            res.send('Reserva realizada con éxito');
        });
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
