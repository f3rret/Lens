
import { Card, CardHeader, CardBody, Badge } from 'reactstrap';
import { io } from 'socket.io-client';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css'
import { style } from 'dom-helpers';

export default function Logs(){

    const [ rows, setRows ] = useState('');

    useEffect(() => {
        let socket;
        let temp='';

        fetch('/api/socket').then(()=>{
            socket = io();
        
            socket.on('connect', () => {
                //console.log('connected')
            });

            socket.on('log', (msg) => {
                let row = new TextDecoder().decode(msg);
                let ltype = 'light';
                console.log([row]);
                row = row.replaceAll(/\x1B\[90m/igm, '');
                row = row.replaceAll(/\s\x1B\[0m/igm, '');
                if( row.indexOf('\x1B[32mINF\x1B[0m') > -1){
                    ltype='info';
                    row = row.replace(/\x1B\[32mINF\x1B\[0m/, '');
                }
                else if( row.indexOf('\x1B[1;33mWAR\x1B[0m') > -1){
                    ltype='warning';
                    row = row.replace(/\x1B\[1;33mWAR\x1B\[0m/, '');
                }
                temp = <><Badge className={styles.logBadge} color={ltype}>&nbsp;</Badge><span className={styles.logRow}> {row} </span> {temp}</>;
                setRows(temp);
            });
        });

        return () => { 
            if(socket) socket.close();
            if(temp) temp='';
        }
    }, []);
    
    return(
        <Card>
            <CardHeader tag='h5'>Logs</CardHeader>
            <CardBody>
            <div className={styles.logsContainer}>
                { rows }
            </div>
            </CardBody>
        </Card>);
}