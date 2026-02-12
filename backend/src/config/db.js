import sql from 'mssql';
import 'dotenv/config';

const config = {
    user:process.env.DB_USER,
    password:process.env.DB_PASSWORD,
    server:process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT),
    database:process.env.DB_DATABASE,
    options:{encrypt:false, trustServerCertificate:true},
    pool:{max:10, min:0, idleTimeoutMillis:30000}
};

const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {console.log('MSSQL connected'); return pool; })
    .catch(err => {console.error('DB connection failed:' , err); process.exit(1);});

export {sql , poolPromise };