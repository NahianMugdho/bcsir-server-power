// const mqtt = require('mqtt');
// const { MongoClient } = require('mongodb');
// require('dotenv').config();

// // ===================== MQTT Configuration ===================
// const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
// const MQTT_TOPICS = [
//     'BCSIRbus',
//     'BCSIRshunt',
//     'BCSIRload',
//     'BCSIRcurrent',
//     'BCSIRpower'
// ];

// // ===================== MongoDB Configuration ===================
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
// const DB_NAME = process.env.DB_NAME || 'mqtt_data';
// const COLLECTION_NAME = process.env.COLLECTION_NAME || 'sensor_data';

// let mongoClient;
// let db;
// let collection;

// // ===================== MongoDB Connection ===================
// async function connectMongoDB() {
//     try {
//         mongoClient = new MongoClient(MONGODB_URI);
//         await mongoClient.connect();
        
//         db = mongoClient.db(DB_NAME);
//         collection = db.collection(COLLECTION_NAME);
        
//         // Index তৈরি করুন (performance এর জন্য)
//         await collection.createIndex({ topic: 1 });
//         await collection.createIndex({ timestamp: -1 });
        
//         console.log('✅ MongoDB Connected Successfully');
//         console.log(`📍 Database: ${DB_NAME}`);
//         console.log(`📍 Collection: ${COLLECTION_NAME}`);
//     } catch (error) {
//         console.error('❌ MongoDB Connection Failed:', error.message);
//         process.exit(1);
//     }
// }

// // MongoDB Connection Start
// connectMongoDB();

// // ===================== MQTT Client Setup ===================
// const mqttClient = mqtt.connect(MQTT_BROKER, {
//     clientId: `mqtt_mongodb_${Math.random().toString(16).slice(3)}`,
//     clean: true,
//     reconnectPeriod: 1000,
//     connectTimeout: 30 * 1000
// });

// // ===================== MQTT Event Handlers ===================
// mqttClient.on('connect', () => {
//     console.log('✅ MQTT Broker Connected Successfully');
//     console.log(`📍 Broker: ${MQTT_BROKER}`);
//     console.log('📡 subscribed...\n');

//     // সব টপিকে সাবস্ক্রাইব করুন
//     MQTT_TOPICS.forEach(topic => {
//         mqttClient.subscribe(topic, { qos: 1 }, (err) => {
//             if (err) {
//                 console.error(`❌ ${topic} Subscribe Failed:`, err.message);
//             } else {
//                 console.log(`✅ Subscribed: ${topic}`);
//             }
//         });
//     });
// });

// mqttClient.on('message', async (topic, message) => {
//     try {
//         const value = message.toString();
//         const timestamp = new Date();

//         console.log('\n📨 new message arrived:');
//         console.log(`   Topic: ${topic}`);
//         console.log(`   Value: ${value}`);
//         console.log(`   Time: ${timestamp.toLocaleString('en-BD')}`);

//         // MongoDB তে ডাটা সংরক্ষণ করুন
//         const document = {
//             topic: topic,
//             value: value,
//             timestamp: timestamp,
//             createdAt: timestamp
//         };

//         const result = await collection.insertOne(document);
//         console.log(`✅ Saved to MongoDB  (ID: ${result.insertedId})`);

//     } catch (error) {
//         console.error('❌ Error saving to MongoDB:', error.message);
//     }
// });

// mqttClient.on('error', (error) => {
//     console.error('❌ MQTT Error:', error.message);
// });

// mqttClient.on('offline', () => {
//     console.log('⚠️  MQTT Client OFFLIne');
// });

// mqttClient.on('reconnect', () => {
//     console.log('🔄 MQTT Reconnecting...');
// });

// // ===================== Graceful Shutdown ===================
// process.on('SIGINT', async () => {
//     console.log('\n\n⚠️  Server shutting down gracefully...');
    
//     mqttClient.end(() => {
//         console.log('✅ MQTT Client disconnected');
//     });

//     if (mongoClient) {
//         await mongoClient.close();
//         console.log('✅ MongoDB Connection closed');
//     }
    
//     process.exit(0);
// });

// console.log('\n🚀 Server started successfully...');
// console.log('⏳ Waiting for MQTT and MongoDB connections...\n');


////////////////////////////////////////////////////////////////////

// .env file content example:
// # ===================== MQTT Configuration ===================
// # MQTT Broker URL
// MQTT_BROKER=mqtt://test.mosquitto.org

// # ===================== MongoDB Configuration ===================
// # MongoDB Connection URI
// # Local MongoDB এর জন্য:
// MONGODB_URI=mongodb+srv://1804021_db_user:J6fYVUtDCqJueCR5@cluster0.c4xbehv.mongodb.net/?appName=Cluster0

// # Database Name
// DB_NAME=mqtt_data

// # Collection Name
// COLLECTION_NAME=sensor_data



// # ===================== Server Configuration ===================
// # Server Port (যদি পরবর্তীতে HTTP API যোগ করতে চান)
// PORT=3000

// SHEET_ID=
//////////////////////////////////////////////////////////////////////////////

const mqtt = require('mqtt');
const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ===================== Configuration ===================
const MQTT_BROKER = process.env.MQTT_BROKER || 'mqtt://test.mosquitto.org';
const MQTT_TOPICS = [
    'BCSIRbus',
    'BCSIRshunt',
    'BCSIRload',
    'BCSIRcurrent',
    'BCSIRpower'
];

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'mqtt_data';
const COLLECTION_NAME = process.env.COLLECTION_NAME || 'sensor_data';
const PORT = process.env.PORT || 3000;

let mongoClient;
let db;
let collection;
let mqttClient;

// ===================== Express App Setup ===================
const app = express();
app.use(cors());
app.use(express.json());

// ===================== MongoDB Connection ===================
async function connectMongoDB() {
    try {
        mongoClient = new MongoClient(MONGODB_URI);
        await mongoClient.connect();
        
        db = mongoClient.db(DB_NAME);
        collection = db.collection(COLLECTION_NAME);
        
        await collection.createIndex({ topic: 1 });
        await collection.createIndex({ timestamp: -1 });
        
        console.log('✅ MongoDB Connected Successfully');
        console.log(`📍 Database: ${DB_NAME}`);
        console.log(`📍 Collection: ${COLLECTION_NAME}`);
    } catch (error) {
        console.error('❌ MongoDB Connection Failed:', error.message);
        process.exit(1);
    }
}

// ===================== MQTT Setup ===================
function setupMQTT() {
    mqttClient = mqtt.connect(MQTT_BROKER, {
        clientId: `mqtt_mongodb_${Math.random().toString(16).slice(3)}`,
        clean: true,
        reconnectPeriod: 1000,
        connectTimeout: 30 * 1000
    });

    mqttClient.on('connect', () => {
        console.log('✅ MQTT Broker Connected Successfully');
        console.log(`📍 Broker: ${MQTT_BROKER}`);
        console.log('📡 Subscribing to topics...\n');

        MQTT_TOPICS.forEach(topic => {
            mqttClient.subscribe(topic, { qos: 1 }, (err) => {
                if (err) {
                    console.error(`❌ ${topic} Subscribe Failed:`, err.message);
                } else {
                    console.log(`✅ Subscribed: ${topic}`);
                }
            });
        });
    });

    mqttClient.on('message', async (topic, message) => {
        try {
            const value = message.toString();
            const timestamp = new Date();

            console.log('\n📨 New message received:');
            console.log(`   Topic: ${topic}`);
            console.log(`   Value: ${value}`);
            console.log(`   Time: ${timestamp.toLocaleString('en-US')}`);

            const document = {
                topic: topic,
                value: value,
                timestamp: timestamp,
                createdAt: timestamp
            };

            const result = await collection.insertOne(document);
            console.log(`✅ Saved to MongoDB (ID: ${result.insertedId})`);

        } catch (error) {
            console.error('❌ Error saving to MongoDB:', error.message);
        }
    });

    mqttClient.on('error', (error) => {
        console.error('❌ MQTT Error:', error.message);
    });

    mqttClient.on('offline', () => {
        console.log('⚠️  MQTT Client OFFLINE');
    });

    mqttClient.on('reconnect', () => {
        console.log('🔄 MQTT Reconnecting...');
    });
}

// ===================== API Routes ===================

// Get latest sensor data
app.get('/api/latest', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        
        const data = await collection
            .find()
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// // Get all data (for Excel export)
// app.get('/api/all', async (req, res) => {
//     try {
//         const data = await collection
//             .find()
//             .sort({ timestamp: -1 })
//             .toArray();

//         res.json({
//             success: true,
//             count: data.length,
//             data: data
//         });
//     } catch (error) {
//         res.status(500).json({
//             success: false,
//             error: error.message
//         });
//     }
// });
// Get all data (with optional date range for charts + Excel export)
app.get('/api/all', async (req, res) => {
    try {
        const { from, to } = req.query
        let query = {}

        if (from || to) {
            query.timestamp = {}
            if (from) query.timestamp.$gte = new Date(from)
            if (to)   query.timestamp.$lte = new Date(to)
        }

        const data = await collection
            .find(query)
            .sort({ timestamp: -1 })
            .toArray();

        res.json({
            success: true,
            count: data.length,
            data: data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
// Get latest value for each topic
app.get('/api/current', async (req, res) => {
    try {
        const topics = ['BCSIRbus', 'BCSIRshunt', 'BCSIRload', 'BCSIRcurrent', 'BCSIRpower'];
        const current = {};

        for (const topic of topics) {
            const latest = await collection
                .findOne({ topic: topic }, { sort: { timestamp: -1 } });
            
            if (latest) {
                current[topic] = {
                    value: latest.value,
                    timestamp: latest.timestamp
                };
            }
        }

        res.json({
            success: true,
            data: current
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Get statistics
app.get('/api/stats', async (req, res) => {
    try {
        const totalCount = await collection.countDocuments();
        const topics = await collection.distinct('topic');
        
        const topicCounts = {};
        for (const topic of topics) {
            topicCounts[topic] = await collection.countDocuments({ topic });
        }

        res.json({
            success: true,
            data: {
                totalRecords: totalCount,
                topics: topics,
                topicCounts: topicCounts
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        mongodb: mongoClient ? 'connected' : 'disconnected',
        mqtt: mqttClient && mqttClient.connected ? 'connected' : 'disconnected'
    });
});

// ===================== Start Everything ===================
async function startServer() {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 BCSIR MQTT Server with API');
    console.log('='.repeat(60) + '\n');

    // Connect to MongoDB
    await connectMongoDB();

    // Setup MQTT
    setupMQTT();

    // Start Express API server
    app.listen(PORT, () => {
        console.log(`\n✅ API Server running on http://localhost:${PORT}`);
        console.log(`📡 API endpoints:`);
        console.log(`   - GET /api/latest?limit=50`);
        console.log(`   - GET /api/all`);
        console.log(`   - GET /api/current`);
        console.log(`   - GET /api/stats`);
        console.log(`   - GET /api/health\n`);
        console.log('💡 Press Ctrl+C to stop\n');
    });
}

// ===================== Graceful Shutdown ===================
process.on('SIGINT', async () => {
    console.log('\n\n⚠️  Server shutting down gracefully...');
    
    if (mqttClient) {
        mqttClient.end(() => {
            console.log('✅ MQTT Client disconnected');
        });
    }

    if (mongoClient) {
        await mongoClient.close();
        console.log('✅ MongoDB Connection closed');
    }
    
    console.log('👋 Goodbye!\n');
    process.exit(0);
});

// Start the server
startServer().catch(console.error);