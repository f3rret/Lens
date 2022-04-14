

export default async function handler(req, res) {

    const sqlite3 = require('sqlite3').verbose();
    const db=new sqlite3.Database('db.sqlite');
    const camid=req.query.name;

    if(!camid){
        res.status(200).json({});
        return;
    }

    const sql=`SELECT * FROM cams WHERE name=?`;

    const result=await new Promise((resolve, reject)=>
            db.get(sql, [camid], (err, row)=>{
                db.close();
                resolve(err ? {err} : row);
            }))
        .catch(error=>{return {err: error}});

    res.status(200).json(result);
}