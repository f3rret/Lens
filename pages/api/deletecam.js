
export default async function handler(req, res){

    const body = req.body

    if (!body.cam_name) {
        return res.status(200).json({ data: 'cam name not found' });
    }

    const sqlite3 = require('sqlite3').verbose();
    const db = new sqlite3.Database('db.sqlite');
    const sql = `DELETE from cams WHERE name=?`;
    const sresult = await new Promise((resolve, reject)=>
            db.run(sql, [body.cam_name], (err)=>{
                db.close();
                resolve(err ? {err} : {});
            }))
        .catch(error=>{reject({err: error})});

    const yaml = require('js-yaml');
    const fs = require('fs');
    const config = yaml.load(fs.readFileSync('rtsp-simple-server.yml', 'utf8'));

    delete config.paths[body.cam_name];
    delete config.encryption; // строковый ключ "no" обрабатывается как bool и rtsp-ss падает

    const wresult = await fs.writeFile('rtsp-simple-server.yml', yaml.dump(config, { noCompatMode: true, quotingType: '"'}), (err) => {
        if (err) {
            return {err: error}
        }
    });

    return res.status(200).json(sresult || wresult);

}