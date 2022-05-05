
import { Row, Col, Card, CardHeader, CardBody, Badge } from 'reactstrap';
import { io } from 'socket.io-client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import styles from '../styles/Home.module.css'

export default function Logs(){

    const [ rows, setRows ] = useState([]);
    const [ dispRows, setDispRows ] = useState([]);
    const [ played, setPlayed ] = useState(true);
    const [ filters, setFilters ] = useState({ light: true, info: true, warning: true, danger: true });

    let socket;

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

                    if(/GET\s+\/v1\/paths\/list$/igm.test(row) || /GET\s+\/v1\/rtspsessions\/list$/igm.test(row)){
                        ltype='light';
                    }
                }
                else if(WAR.test(row)){
                    ltype='warning';
                    row = row.replaceAll(WAR, '');
                }
                else if(ERR.test(row)){
                    ltype='danger';
                    row = row.replaceAll(ERR, '');
                }

                setRows([{ltype, row}, ...rows]);
            });
        });

        return () => { 
            if(socket) socket.close();
        }
    }, [played]);
    

    const handlePause = (e) => {
        e.preventDefault();
        e.stopPropagation();

        setPlayed(!played);
    }

    const handleFilterClick = (t) => {
        const tmp = {...filters};
        tmp[t] = !tmp[t];
        setFilters(tmp);
    }

    useMemo(() => {
        const news = rows.map((v,i)=>{
            return (<span key={i} t={v.ltype}><Badge className={styles.logBadge} color={v.ltype}>&nbsp;</Badge><span className={styles.logRow}> {v.row} </span></span>);
        });
        
        setDispRows([news, ...dispRows].slice(0, 100));
    }, [rows]);

    const getFilteredRows = useMemo(()=>{
        return dispRows.filter((v, i) => {
            if(!v[0] || !v[0].props) return false;
            return filters[v[0].props.t];
        });
    }, [filters, dispRows]);

    return(
        <Card>
            <CardHeader tag='h5'>Logs</CardHeader>
            <CardBody>
                <Row style={{marginBottom: '1rem'}}>
                    <Col xs={3}>
                        <Badge className={filters['light'] ? styles.filterBadge:styles.filterBadgeInactive} onClick={()=>handleFilterClick('light')} color='light' style={{color: 'black'}}>DBG</Badge>
                        <Badge className={filters['info'] ? styles.filterBadge:styles.filterBadgeInactive} onClick={()=>handleFilterClick('info')} color='info'>INF</Badge>
                        <Badge className={filters['warning'] ? styles.filterBadge:styles.filterBadgeInactive} onClick={()=>handleFilterClick('warning')} color='warning'>WAR</Badge>
                        <Badge className={filters['danger'] ? styles.filterBadge:styles.filterBadgeInactive} onClick={()=>handleFilterClick('danger')} color='danger'>ERR</Badge>
                    </Col>
                    <Col xs={7}></Col>
                    <Col xs={2}>
                        <a onClick={handlePause} className={styles.logPauseButton}>{played ? <span className="bi-pause"> pause</span>:<span className="bi-play"> resume</span>}</a>
                    </Col>
                </Row>
                <Row>
                    <div className={styles.logsContainer}>
                        { getFilteredRows }
                    </div>
                </Row>
            </CardBody>
        </Card>);
}