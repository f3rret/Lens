export default async function handler(req, res) {
  const body = req.body

  if (!body.cam_name) {
    return res.json({ data: 'cam name not found' })
  }
  
  const sqlite3 = require('sqlite3').verbose();
  const db = new sqlite3.Database('db.sqlite');
  let sresult = {};

  if(body.sql_camid){
    const sql = `UPDATE cams SET name=?, model=?, description='' WHERE name=?`;
    sresult = await new Promise((resolve, reject)=>
            db.run(sql, [body.cam_name, body.cam_model, body.sql_camid], (err)=>{
                db.close();
                resolve(err ? {err} : {});
            }))
        .catch(error=>{reject({err: error})});
  }
  else{
    const sql = `INSERT INTO cams(name, model, src_url) VALUES(?, ?, '')`;
    sresult = await new Promise((resolve, reject)=>
            db.run(sql, [body.cam_name, body.cam_model], (err)=>{
                db.close();
                resolve(err ? {err} : {});
            }))
        .catch(error=>{reject({err: error})});
  }
  
  const yaml = require('js-yaml');
  const fs = require('fs');

  const config = yaml.load(fs.readFileSync('rtsp-simple-server.yml', 'utf8'));
  
  if(body.sql_camid!==body.cam_name){
    delete config.paths[body.sql_camid];
  }

  const url_arr=/^(\w*:\/\/)(\S*)$/.exec(body.cam_url);
  const full_url = url_arr && url_arr.length > 2 ? url_arr[1] + body.src_username + ':' + body.src_password + '@' + url_arr[2] : body.cam_url;

  if(url_arr[1].toLowerCase().startsWith('http')){ //-deinterlace -force_duplicated_matrix 1 -huffman 0 -s 1280x1024
    const mjpeg = `ffmpeg -i ${full_url} -input_format mjpeg -f v4l2 -pix_fmt yuvj420p -c:v libx264 -preset ultrafast -b:v 600k -max_muxing_queue_size 1024 -g 30 -f rtsp rtsp://localhost:$RTSP_PORT/${body.cam_name}`;
    config.paths[body.cam_name] = { runOnDemand: mjpeg, runOnDemandRestart: 'yes' }
  }
  else{
    config.paths[body.cam_name] = { source: full_url, sourceOnDemand: 'yes' };
  }
  
  delete config.encryption; // строковый ключ "no" обрабатывается как bool и rtsp-ss падает
  const wresult = await fs.writeFile('rtsp-simple-server.yml', yaml.dump(config, { noCompatMode: true, quotingType: '"'}), (err) => {
        if (err) {
            console.log(err);
            return {err: error}
        }
  });

  return res.json(sresult || wresult);

}
