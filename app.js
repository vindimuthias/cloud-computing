require('@google-cloud/debug-agent').start()

// Imports
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const uuid = require('uuid');

// Express
const app = express()
// const port = 3000

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MySQL
const database = mysql.createConnection({
    host: '34.101.44.234',
    user: 'root',
    password: "gP_4r)GN2'B>k<5.",
    database: 'trashup'
});

app.get('/', (req, res) => {
    res.status(404).send({ message: 'Not found!' });
})

app.post('/register', (req, res) => {
    const { name, email, password } = req.query;
    const id = uuid.v4();
    const insertQuery = "INSERT INTO users (id, name, email, password) VALUES (?,?,?,?)";

    database.query(insertQuery, [id, name, email, password], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            const createdUser = {
                id: id,
                name: name,
                email: email
            };
            res.status(201).send({ data: createdUser });
        }
    });
});

app.post('/login', (req, res) => {
    const { email, password } = req.query;
    const query = "SELECT * FROM users WHERE email = ? AND password = ?";

    database.query(query, [email, password], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            if (rows.length < 1) {
                res.status(400).send({ message: 'Not found' });
            } else {
                const user = rows[0];
                require('crypto').randomBytes(48, function (err, buf) {
                    const token = buf.toString('hex');
                    const update = "UPDATE users SET token = ? WHERE id = ?";

                    database.query(update, [token, user.id], (err, rows, field) => {
                        if (err) {
                            res.status(500).send({ message: err.sqlMessage });
                        } else {
                            res.status(200).send({ token: token });
                        }
                    });
                });
            }
        }
    });
});


// Middleware
const authMiddleware = function (req, res, next) {

    const token = req.headers['authorization'].replace('Bearer ', '');
    const query = "SELECT * FROM users WHERE token = ?";

    database.query(query, [token], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else if (rows.length === 0) {
            res.status(401).send({ message: 'Unauthorized!' });
        } else {
            next();
        }
    });
}

app.use(authMiddleware);

app.get('/users', (req, res) => {
    const query = "SELECT * FROM users";

    database.query(query, (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage })
        } else {
            res.status(200).send({ data: rows });
        }
    });
});

app.get('/users/:id', (req, res) => {
    const parameter = req.params.id;
    const query = "SELECT * FROM users WHERE id = ?";

    database.query(query, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            if (rows.length < 1) {
                res.status(404).send({ message: "Not found!" });
            } else {
                res.status(200).send({ data: rows[0] })
            }
        }
    });
});

app.post('/new-driver/:id', (req, res) => {
    const parameter = req.params.id;
    const checkIfAlready = "SELECT * FROM drivers WHERE user_id = ?";

    database.query(checkIfAlready, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.message });
        } else {
            if (rows.length > 0) {
                res.status(400).send({ message: "Already assigned as driver!" });
            } else {
                const checkIfClient = "SELECT * FROM clients WHERE user_id = ?";

                database.query(checkIfClient, [parameter], (err, rows, field) => {
                    if (err) {
                        res.status(500).send({ message: err.message });
                    } else {
                        if (rows.length > 0) {
                            res.status(400).send({ message: "Already assigned as client!" });
                        } else {
                            const validQuery = "INSERT INTO drivers (id, user_id, license_plat, phone) VALUES (?,?,?,?)";
                            const id = uuid.v4();

                            database.query(validQuery, [id, parameter, req.query.license_plat, req.query.phone], (err, rows, field) => {
                                if (err) {
                                    res.status(500).send({ message: err.sqlMessage });
                                } else {
                                    const createdDriver = {
                                        id: id,
                                        user_id: parameter,
                                        license_plat: req.query.license_plat,
                                        phone: req.query.phone
                                    };

                                    res.status(201).send({ data: createdDriver });
                                }
                            })
                        }
                    }
                });
            }
        }
    });
});

app.post('/new-client/:id', (req, res) => {
    const parameter = req.params.id;
    const checkIfAlready = "SELECT * FROM clients WHERE user_id = ?";

    database.query(checkIfAlready, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.message });
        } else {
            if (rows.length > 0) {
                res.status(400).send({ message: "Already assigned as client!" });
            } else {
                const checkIfDriver = "SELECT * FROM drivers WHERE user_id = ?";

                database.query(checkIfDriver, [parameter], (err, rows, field) => {
                    if (err) {
                        res.status(500).send({ message: err.message });
                    } else {
                        if (rows.length > 0) {
                            res.status(400).send({ message: "Already assigned as driver!" });
                        } else {
                            const validQuery = "INSERT INTO clients (id, user_id, address, phone) VALUES (?,?,?,?)";
                            const id = uuid.v4();

                            database.query(validQuery, [id, parameter, req.query.address, req.query.phone], (err, rows, field) => {
                                if (err) {
                                    res.status(500).send({ message: err.sqlMessage });
                                } else {
                                    const createdClient = {
                                        id: id,
                                        user_id: parameter,
                                        license_plat: req.query.address,
                                        phone: req.query.phone
                                    };

                                    res.status(201).send({ data: createdClient });
                                }
                            })
                        }
                    }
                });
            }
        }
    });
});

app.get('/trash-types', (req, res) => {
    const query = "SELECT * FROM trash_types";

    database.query(query, (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage })
        } else {
            res.status(200).send({ data: rows });
        }
    });
});

app.get('/statuses', (req, res) => {
    const query = "SELECT * FROM statuses";

    database.query(query, (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage })
        } else {
            res.status(200).send({ data: rows });
        }
    });
});

app.get('/trashes/:id', (req, res) => {
    const parameter = req.params.id;
    const query = "SELECT * FROM trashes WHERE id = ?";

    database.query(query, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            res.status(200).send({ data: rows });
        }
    });
});

app.post('/trashes', (req, res) => {
    const { latitude, longitude, checked_in_time } = req.query;
    const id = uuid.v4();
    const insertQuery = "INSERT INTO trashes (id, latitude, longitude, checked_in_time) VALUES (?,?,?,?)";

    database.query(insertQuery, [id, latitude, longitude, checked_in_time], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            const createdTrash = {
                id: id,
                latitude: latitude,
                longitude: longitude,
                checked_in_time: checked_in_time,
            };
            res.status(201).send({ data: createdTrash });
        }
    });
})

app.put('/trashes/:id', (req, res) => {
    const parameter = req.params.id;
    const selected = "SELECT * FROM trashes WHERE id = ?";

    database.query(selected, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            if (rows.length < 1) {
                res.status(404).send({ message: "Not found!" });
            } else {
                const trash = rows[0];
                const checked_out_time = req.query.checked_out_time;
                const update = "UPDATE trashes SET checked_out_time = ? WHERE id = ?";

                database.query(update, [checked_out_time, parameter], (err, rows, field) => {
                    if (err) {
                        res.status(400).send({ message: err.sqlMessage });
                    } else {

                        database.query(selected, [parameter], (err, rows, field) => {
                            if (err) {
                                res.status(400).send({ message: err.sqlMessage });
                            } else {
                                res.status(200).send({ data: rows[0] });
                            }
                        });
                    }
                });
            }
        }
    })
});


app.post('/trash-details', (req, res) => {
    const { trash_id, trash_type_id, description, photo, weight } = req.query;
    const id = uuid.v4();
    const insertQuery = "INSERT INTO trash_details (id, trash_id, trash_type_id, description, photo, weight) VALUES (?,?,?,?,?,?)";

    database.query(insertQuery, [id, trash_id, trash_type_id, description, photo, weight], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            const createdTrashDetail = {
                id: id,
                trash_id: trash_id,
                trash_type_id: trash_type_id,
                description: description,
                photo: photo,
                weight: weight,
            };
            res.status(201).send({ data: createdTrashDetail });
        }
    });
});

app.post('/request-pickup', (req, res) => {
    const { client_id, trash_id } = req.query;
    const id = uuid.v4();
    const insertQuery = "INSERT INTO pickup_orders (id, client_id, trash_id) VALUES (?,?,?)";

    database.query(insertQuery, [id, client_id, trash_id], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            const createdPickupOrder = {
                id: id,
                client_id: client_id,
                trash_id: trash_id,
            };
            res.status(201).send({ data: createdPickupOrder });
        }
    });
});

app.put('/accept-pickup/:id', (req, res) => {
    const parameter = req.params.id;
    const selected = "SELECT * FROM pickup_orders WHERE id = ?";

    database.query(selected, [parameter], (err, rows, field) => {
        if (err) {
            res.status(500).send({ message: err.sqlMessage });
        } else {
            if (rows.length < 1) {
                res.status(404).send({ message: "Not found!" });
            } else {
                const driver_id = req.query.driver_id;
                const update = "UPDATE pickup_orders SET driver_id = ? WHERE id = ?";

                database.query(update, [driver_id, parameter], (err, rows, field) => {
                    if (err) {
                        res.status(400).send({ message: err.sqlMessage });
                    } else {
                        database.query(selected, [parameter], (err, rows, field) => {
                            if (err) {
                                res.status(400).send({ message: err.sqlMessage });
                            } else {
                                res.status(200).send({ data: rows[0] });
                            }
                        });
                    }
                });
            }
        }
    })
});

// app.listen(port, () => {
//     console.log(`Example app listening on port ${port}`)
// })

const PORT = process.env.PORT || 8000
app.listen(PORT, () => {
    console.log("Server is up and listening on " + PORT)
})