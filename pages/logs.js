
import { Row, Col, Card, CardHeader, CardBody, Badge } from 'reactstrap';
import { io } from 'socket.io-client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import styles from '../styles/Home.module.css'

export default function Logs(){

    const [ rows, setRows ] = useState('');
    const [ played, setPlayed ] = useState(true);

    let socket;
    let temp='';

    useEffect(() => {
        if(!played){
            return;
        }

        fetch('/api/socket').then(()=>{
            socket = io();
        
            socket.on('connect', () => {
                //console.log('connected')
            });

            const INF = new RegExp('\\x1B\\[32mINF\\x1B\\[0m', 'igm');
            const WAR = new RegExp('\\x1B\\[1;33mWAR\\x1B\\[0m', 'igm');
            const ERR = new RegExp('\\x1B\\[1;34mERR\\x1B\\[0m', 'igm');
            const BRACKET1 = new RegExp('\\x1B\\[90m', 'igm');
            const BRACKET2 = new RegExp('\\s\\x1B\\[0m', 'igm');

            socket.on('log', (msg) => {
                let row = new TextDecoder().decode(msg);
                let ltype = 'light';

                row = row.replaceAll(BRACKET1, '');
                row = row.replaceAll(BRACKET2, '');

                if(INF.test(row)){
                    ltype='info';
                    row = row.replaceAll(INF, '');
                }
                else if(WAR.test(row)){
                    ltype='warning';
                    row = row.replaceAll(WAR, '');
                }
                else if(ERR.test(row)){
                    ltype='error';
                    row = row.replaceAll(ERR, '');
                }
                temp = <><Badge className={styles.logBadge} color={ltype}>&nbsp;</Badge><span className={styles.logRow}> {row} </span> {temp}</>;
                setRows(temp);
            });
        });

        return () => { 
            if(socket) socket.close();
            if(temp) temp='';
        }
    }, [played]);
    

    const handlePause = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setPlayed(!played);
    }

    return(
        <Card>
            <CardHeader tag='h5'>Logs</CardHeader>
            <CardBody>
                <Row>
                    <Col xs={10}></Col>
                    <Col xs={2}>
                        <a onClick={handlePause} style={{cursor: 'pointer'}}>{played ? <span className="bi-pause"> pause</span>:<span className="bi-play"> resume</span>}</a>
                    </Col>
                </Row>
                <Row>
                    <div className={styles.logsContainer}>
                        { rows }
                    </div>
                </Row>
            </CardBody>
        </Card>);
}