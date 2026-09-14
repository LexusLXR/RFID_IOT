const express = require("express");
const pool = require("./db");

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
    res.send("RFID IoT Backend is running!");
});

app.get("/test-db", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW()");
        res.json({
            message: "PostgreSQL connection successful",
            time: result.rows[0].now
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Database connection failed"
        });
    }
});

app.post("/api/scan", async (req, res) => {
    try {
        const { rfid_uid, device_id } = req.body;

        if (!rfid_uid || !device_id) {
            return res.status(400).json({
                message: "rfid_uid and device_id are required"
            });
        }

        const userResult = await pool.query(
            "Select * From users WHERE rfid_uid = $1",
            [rfid_uid]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                message: "RFID card not registered"
            });
        }

        const user = userResult.rows[0];

        const deviceResult = await pool.query(
            `SELECT d.id, d.device_name, d.device_code, d.location_id,
            l.name AS location_name
            FROM devices d
            JOIN locations l ON d.location_id = l.id
             WHERE d.id = $1`,
            [Number(device_id)]
        );

        if (deviceResult.rows.length === 0) {
            return res.status(404).json({
                message: "Device not found"
            });
        }

        const device = deviceResult.rows[0];

        const lastScanResult = await pool.query(
            `SELECT action
            FROM access_logs
            WHERE user_id = $1
                AND status = 'SUCCESS'
            ORDER BY scanned_at DESC
            LIMIT 1`,
            [user.id]
        );

        let action = "LOGIN";

        if(lastScanResult.rows.length > 0){
            const lastAction = lastScanResult.rows[0].action;

            if (lastAction === "LOGIN"){
                action = "LOGOUT";
            }else{
                action = "LOGIN"
            }
        }

        await pool.query(
            `INSERT INTO access_logs
            (user_id, device_id, rfid_uid, action, status)
            VALUES ($1, $2, $3, $4, $5)`,

            [
                user.id,
                device.id,
                user.rfid_uid,
                action,
                "SUCCESS"
            ]
        );

        res.json({
            message: `RFID ${action.toLowerCase()} successful`,
            user: user.name,
            rfid_uid: user.rfid_uid,
            device: device.device_name,
            location: device.location_name,
            action: action,
            status: "SUCCESS",
            scanned_at: new Date()
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Server error"
        });
    }
});

app.get("/api/logs", async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                a.id,
                u.name AS user_name,
                a.rfid_uid,
                d.device_name,
                l.name AS location,
                a.action,
                a.status,
                a.scanned_at
            FROM access_logs a
            JOIN users u
                ON a.user_id = u.id
            JOIN devices d
                ON a.device_id = d.id
            JOIN locations l
                ON d.location_id = l.id
            ORDER BY a.scanned_at DESC
        `);

        res.json(result.rows);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Failed to fetch access logs"
        });
    }
});

app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});