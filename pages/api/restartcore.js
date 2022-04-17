
import { spawn } from 'child_process';

export default async function handler(req, res) {

    let rss = res.socket.server.rtspss;

    if(rss){
        await rss.kill(9);
    }

    rss = spawn('./rtsp-simple-server');
    res.socket.server.rtspss = rss;

    rss.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
      
    const ws = res.socket.server.io;
    rss.stderr.on('data', (data) => {
        console.error(`stderr: ${data}`);
        ws.emit('log', data);
    });
    
    rss.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });

    res.end();
}