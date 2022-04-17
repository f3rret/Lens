
import useSWRImmutable from 'swr';
import { Card, CardHeader, CardBody, CardText } from 'reactstrap';

import { CamsContext } from './lib/context';
import { useContext, useMemo } from 'react';

export default function Statistics(){

    const fetcher = (...args) => fetch(...args).then(res => res.json());
    const { data } = useSWRImmutable('api/metrics', fetcher, { refreshInterval: 10000 });
    const { cams } = useContext(CamsContext);

    const items = useMemo(()=>{
        const its = cams && cams.items ? Object.entries(cams.items).map((v,k)=>v) : [];
        its.forEach((v)=>{
            its[v[0].toString()]=v;
        });
        return its;
    }, [cams]);

    const stats = useMemo(()=>{
        return { idle:0, read:0, ...data };
    });

    return(
        <Card>
            <CardHeader tag='h5'>Statistics</CardHeader>
            <CardBody>
                <CardText>Total: {items.length} Idle: {stats.idle} Read: {stats.read}</CardText>
            </CardBody>
        </Card>);
}

