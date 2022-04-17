import styles from '../styles/Home.module.css'

import { CamsContext } from './lib/context';
import { useContext } from 'react';
import { UncontrolledAccordion, AccordionHeader, AccordionItem, AccordionBody, Card, CardBody, CardHeader } from 'reactstrap';

export default function Sessions(){

    const { cams, getSessionInfo, kicked, onKickSession } = useContext(CamsContext);
    const items = cams.sessions.items;

    const ips = {};
    Object.entries(items).forEach((v, k) => {
        const src = v[1].remoteAddr.split(':');
    
        if(src[0]!=='127.0.0.1'){ // http->rtsp muxer
            if(!ips[src[0]]) ips[src[0]]=[];
            ips[src[0]].push(v[0]);
        }
    });

    const kickLeech = (e, id)=>{
        e.preventDefault();
        e.stopPropagation();

        fetch(`/api/kickleech?sessionid=${id}`).then(async(result) => {
            if(result.ok){
                onKickSession(id);
            }
        });
    }

    const keys = Object.keys(ips);
    const acitems = keys.map((k) => {
        return (<AccordionItem key={k}>
                    <AccordionHeader targetId={k} className={styles.sessionsAccHeader}><span className={styles.sessionsInfoCounter}>{ips[k].length}</span>{k}</AccordionHeader>
                    <AccordionBody accordionId={k} className={styles.sessionsAccBody}>{
                        ips[k].map((v, k)=>{
                            const cls = styles.sessionsCam + ( kicked.indexOf(v)>-1 ? ` ${styles.kicked}`:'');
                            return <span className={cls} key={k} sessid={v}> 
                                {`[${v}] ` + getSessionInfo(v).cam}<i onClick={(e)=>kickLeech(e, v)} className={`${styles.kickLeech} bi-x-square-fill`}/></span>
                        })
                    }</AccordionBody>
                </AccordionItem>);
    });

    return (
        <Card>
            <CardHeader tag='h5'>Sessions</CardHeader>
            <CardBody>
                <UncontrolledAccordion>
                    {acitems}
                </UncontrolledAccordion>
            </CardBody>
        </Card>
        );
}

