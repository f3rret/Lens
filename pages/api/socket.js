
import { Server } from 'socket.io';

export default async function handler(req, res) {

    if (!res.socket.server.io) {
        const io = new Server(res.socket.server);
        res.socket.server.io = io;

        io.on('connection', socket => {
            //socket.on('input-change', msg => {
              
            //})
        });
    }

    res.end();
}