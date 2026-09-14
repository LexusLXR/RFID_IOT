import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:5000";

function App() {
    const [users, setUsers] = useState([]);
    const [devices, setDevices] = useState([]);
    const [logs, setLogs] = useState([]);

    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedDeviceId, setSelectedDeviceId] = useState("");

    const [loading, setLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    // Load users, devices and logs from backend
    useEffect(() => {
        loadDashboardData();
    }, []);

    async function loadDashboardData() {
        try {
            setLoading(true);
            setError("");

            const [usersResponse, devicesResponse, logsResponse] =
                await Promise.all([
                    fetch(`${API_URL}/api/users`),
                    fetch(`${API_URL}/api/devices`),
                    fetch(`${API_URL}/api/logs`)
                ]);

            if (!usersResponse.ok || !devicesResponse.ok || !logsResponse.ok) {
                throw new Error("Failed to load dashboard data");
            }

            const usersData = await usersResponse.json();
            const devicesData = await devicesResponse.json();
            const logsData = await logsResponse.json();

            setUsers(usersData);
            setDevices(devicesData);
            setLogs(logsData);

            if (usersData.length > 0) {
                setSelectedUserId(String(usersData[0].id));
            }

            if (devicesData.length > 0) {
                setSelectedDeviceId(String(devicesData[0].id));
            }

        } catch (error) {
            console.error(error);
            setError("Unable to connect to the RFID backend.");
        } finally {
            setLoading(false);
        }
    }

    async function handleScan() {
        if (scanning) return;

        const selectedUser = users.find(
            (user) => String(user.id) === String(selectedUserId)
        );

        const selectedDevice = devices.find(
            (device) => String(device.id) === String(selectedDeviceId)
        );

        if (!selectedUser || !selectedDevice) {
            setError("Please select a user and RFID reader.");
            return;
        }

        try {
            setScanning(true);
            setError("");
            setSuccessMessage("");

            const response = await fetch(`${API_URL}/api/scan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    rfid_uid: selectedUser.rfid_uid,
                    device_id: Number(selectedDevice.id)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "RFID scan failed");
            }

            setSuccessMessage(
                `${data.user} ${data.action.toLowerCase()} successful`
            );

            // Refresh logs after successful scan
            const logsResponse = await fetch(`${API_URL}/api/logs`);

            if (logsResponse.ok) {
                const logsData = await logsResponse.json();
                setLogs(logsData);
            }

        } catch (error) {
            console.error(error);
            setError(error.message || "RFID scan failed.");
        } finally {
            setTimeout(() => {
                setScanning(false);
            }, 800);
        }
    }

    const selectedUser = users.find(
        (user) => String(user.id) === String(selectedUserId)
    );

    const selectedDevice = devices.find(
        (device) => String(device.id) === String(selectedDeviceId)
    );

    const lastScan = logs.length > 0 ? logs[0] : null;

    const successfulScans = logs.filter(
        (log) => log.status === "SUCCESS"
    ).length;

    const loginCount = logs.filter(
        (log) => log.action === "LOGIN"
    ).length;

    const logoutCount = logs.filter(
        (log) => log.action === "LOGOUT"
    ).length;

    const filteredLogs = useMemo(() => {
        return logs.filter((log) => {
            const matchesSearch =
                log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
                log.rfid_uid?.toLowerCase().includes(search.toLowerCase()) ||
                log.device_name?.toLowerCase().includes(search.toLowerCase()) ||
                log.location?.toLowerCase().includes(search.toLowerCase());

            const matchesFilter =
                filter === "ALL" ||
                log.action === filter ||
                log.status === filter;

            return matchesSearch && matchesFilter;
        });
    }, [logs, search, filter]);

    function formatTime(timestamp) {
        if (!timestamp) return "--";

        return new Date(timestamp).toLocaleString("en-IN", {
            dateStyle: "medium",
            timeStyle: "short"
        });
    }

    return (
        <div className="app">

            {/* Sidebar */}
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">
                        RFID
                    </div>

                    <div>
                        <h1>RFID IoT</h1>
                        <span>ACCESS CONTROL</span>
                    </div>
                </div>

                <nav className="navigation">
                    <div className="nav-item active">
                        <span>▣</span>
                        Dashboard
                    </div>

                    <div className="nav-item">
                        <span>◉</span>
                        RFID Scanner
                    </div>

                    <div className="nav-item">
                        <span>▤</span>
                        Access Logs
                    </div>

                    <div className="nav-item">
                        <span>⚙</span>
                        System
                    </div>
                </nav>

                <div className="connection-card">
                    <div className="connection-dot"></div>

                    <div>
                        <strong>Backend Connected</strong>
                        <small>localhost:5000</small>
                    </div>
                </div>
            </aside>


            {/* Main */}
            <main className="main-content">

                {/* Header */}
                <header className="topbar">
                    <div>
                        <p className="eyebrow">SYSTEM OVERVIEW</p>
                        <h2>RFID Access Dashboard</h2>
                    </div>

                    <button
                        className="refresh-button"
                        onClick={loadDashboardData}
                    >
                        ↻ Refresh
                    </button>
                </header>


                {/* Error */}
                {error && (
                    <div className="alert error">
                        <strong>Error:</strong> {error}
                    </div>
                )}


                {/* Success */}
                {successMessage && (
                    <div className="alert success">
                        ✓ {successMessage}
                    </div>
                )}


                {/* Metrics */}
                <section className="metric-strip">

                    <div className="metric-card">
                        <span className="metric-label">REGISTERED USERS</span>
                        <strong>{users.length}</strong>
                        <small>Active RFID users</small>
                    </div>

                    <div className="metric-card">
                        <span className="metric-label">RFID READERS</span>
                        <strong>{devices.length}</strong>
                        <small>Connected devices</small>
                    </div>

                    <div className="metric-card">
                        <span className="metric-label">TOTAL SCANS</span>
                        <strong>{successfulScans}</strong>
                        <small>Successful access events</small>
                    </div>

                    <div className="metric-card">
                        <span className="metric-label">LOGIN / LOGOUT</span>
                        <strong>{loginCount} / {logoutCount}</strong>
                        <small>Access activity</small>
                    </div>

                </section>


                {/* Scanner */}
                <section className="scanner-section">

                    <div className="panel scanner-panel">

                        <div className="panel-header">
                            <div>
                                <p className="eyebrow">SIMULATED RFID READER</p>
                                <h3>Scan RFID Card</h3>
                            </div>

                            <span className="live-badge">
                                <span></span>
                                LIVE
                            </span>
                        </div>


                        <div className="scanner-content">

                            <div className="scanner-visual">
                                <div className={`radar ${scanning ? "scanning" : ""}`}>
                                    <div className="radar-ring ring-one"></div>
                                    <div className="radar-ring ring-two"></div>
                                    <div className="radar-ring ring-three"></div>

                                    <div className="rfid-card">
                                        <div className="rfid-chip"></div>
                                        <span>RFID</span>
                                    </div>
                                </div>

                                <p>
                                    {scanning
                                        ? "Reading RFID card..."
                                        : "Ready to scan"}
                                </p>
                            </div>


                            <div className="scan-controls">

                                <label>
                                    RFID Card
                                </label>

                                <select
                                    value={selectedUserId}
                                    onChange={(e) =>
                                        setSelectedUserId(e.target.value)
                                    }
                                    disabled={loading || scanning}
                                >
                                    {users.map((user) => (
                                        <option
                                            key={user.id}
                                            value={user.id}
                                        >
                                            {user.name} — {user.rfid_uid}
                                        </option>
                                    ))}
                                </select>


                                <label>
                                    RFID Reader
                                </label>

                                <select
                                    value={selectedDeviceId}
                                    onChange={(e) =>
                                        setSelectedDeviceId(e.target.value)
                                    }
                                    disabled={loading || scanning}
                                >
                                    {devices.map((device) => (
                                        <option
                                            key={device.id}
                                            value={device.id}
                                        >
                                            {device.device_name} — {device.location}
                                        </option>
                                    ))}
                                </select>


                                <button
                                    className={`scan-button ${scanning ? "scanning-button" : ""}`}
                                    onClick={handleScan}
                                    disabled={loading || scanning}
                                >
                                    {scanning
                                        ? "SCANNING..."
                                        : "SCAN CARD"}
                                </button>

                            </div>

                        </div>

                    </div>


                    {/* Last Scan */}
                    <div className="panel last-scan-panel">

                        <div className="panel-header">
                            <div>
                                <p className="eyebrow">LATEST EVENT</p>
                                <h3>Last Scan</h3>
                            </div>
                        </div>

                        {lastScan ? (
                            <div className="last-scan">

                                <div className="status-icon">
                                    ✓
                                </div>

                                <div className="last-scan-info">
                                    <strong>{lastScan.user_name}</strong>

                                    <span>
                                        {lastScan.action} · {lastScan.location}
                                    </span>

                                    <small>
                                        {formatTime(lastScan.scanned_at)}
                                    </small>
                                </div>

                                <span className="success-label">
                                    {lastScan.status}
                                </span>

                            </div>
                        ) : (
                            <div className="empty-state">
                                No scans recorded yet.
                            </div>
                        )}

                    </div>

                </section>


                {/* Devices */}
                <section className="panel">

                    <div className="panel-header">
                        <div>
                            <p className="eyebrow">IOT INFRASTRUCTURE</p>
                            <h3>RFID Readers</h3>
                        </div>
                    </div>

                    <div className="device-list">

                        {devices.map((device) => (
                            <div className="device-card" key={device.id}>

                                <div className="device-icon">
                                    RFID
                                </div>

                                <div className="device-info">
                                    <strong>{device.device_name}</strong>

                                    <span>
                                        {device.location}
                                    </span>

                                    <small>
                                        {device.device_code}
                                    </small>
                                </div>

                                <div className="device-status">
                                    <span
                                        className={
                                            device.status
                                                ? "status-online"
                                                : "status-offline"
                                        }
                                    >
                                        {device.status ? "ONLINE" : "OFFLINE"}
                                    </span>
                                </div>

                            </div>
                        ))}

                    </div>

                </section>


                {/* Logs */}
                <section className="panel logs-panel">

                    <div className="panel-header logs-header">

                        <div>
                            <p className="eyebrow">DATABASE RECORDS</p>
                            <h3>Access Logs</h3>
                        </div>

                        <div className="log-controls">

                            <input
                                type="text"
                                placeholder="Search logs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />

                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="ALL">All</option>
                                <option value="LOGIN">Login</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="SUCCESS">Success</option>
                            </select>

                        </div>

                    </div>


                    {filteredLogs.length > 0 ? (
                        <div className="table-container">

                            <table>

                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>RFID UID</th>
                                        <th>Reader</th>
                                        <th>Location</th>
                                        <th>Action</th>
                                        <th>Status</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {filteredLogs.map((log) => (
                                        <tr key={log.id}>

                                            <td>
                                                <strong>{log.user_name}</strong>
                                            </td>

                                            <td>
                                                <code>{log.rfid_uid}</code>
                                            </td>

                                            <td>
                                                {log.device_name}
                                            </td>

                                            <td>
                                                {log.location}
                                            </td>

                                            <td>
                                                <span
                                                    className={`action-badge ${log.action.toLowerCase()}`}
                                                >
                                                    {log.action}
                                                </span>
                                            </td>

                                            <td>
                                                <span className="status-success">
                                                    {log.status}
                                                </span>
                                            </td>

                                            <td>
                                                {formatTime(log.scanned_at)}
                                            </td>

                                        </tr>
                                    ))}

                                </tbody>

                            </table>

                        </div>
                    ) : (
                        <div className="empty-state">
                            No matching access logs.
                        </div>
                    )}

                </section>

            </main>

        </div>
    );
}

export default App;