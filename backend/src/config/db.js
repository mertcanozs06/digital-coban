import sql from 'mssql';
import 'dotenv/config';

const isNamedInstance = process.env.DB_SERVER && process.env.DB_SERVER.includes('\\');
const [serverHost, instanceName] = isNamedInstance ? process.env.DB_SERVER.split('\\') : [process.env.DB_SERVER, null];

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: serverHost,
    port: parseInt(process.env.DB_PORT) || 1433,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, 
        trustServerCertificate: true,
        instanceName: instanceName
    },
    pool: { max: 10, min: 0, idleTimeoutMillis: 30000 }
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {console.log('MSSQL connected'); return pool; })
    .catch(err => {console.error('DB connection failed:' , err); process.exit(1);});

export {sql , poolPromise };