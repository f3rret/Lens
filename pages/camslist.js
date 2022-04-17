
import { Table, UncontrolledPopover, PopoverBody, PopoverHeader } from 'reactstrap';;
import { CamsContext } from './lib/context';
import { useContext } from 'react';
import styles from '../styles/Home.module.css';

export default function CamsList(){

    const { cams, selected, onSelect } = useContext(CamsContext);
    if(!cams || !cams.items) return(<></>);

    const camsTable=Object.entries(cams.items).map((v, k)=>{
        return <Cam 
                key={k}
                no={k} 
                isSelected={ v[0] === selected.key } 
                handleClick={(e) => trClickHandler(e, v[0], v)}
                {...v}
                />;
    });

    const trClickHandler=(event, key, value)=>{
        if(selected.key === key){
            onSelect({});
        }
        else{
            onSelect({key, value});
        }
    }

    return(
        <Table hover bordered >
            <thead>
            <tr><th>#</th><th>Name</th><th>Type</th><th>IP:port</th><th>S</th><th>L</th></tr>
            </thead>
            <tbody>
            {camsTable}
            </tbody>
        </Table>
    );
}

function Cam(props){
    
    let src=props[1].conf.source;

    if(props[1].conf.runOnDemand){
        const line=props[1].conf.runOnDemand.split(' ');
        src=line[2];
    }
        
    const protocol=src.substring(0, src.indexOf(':'));
    const ipport=src.substring(src.indexOf('@')+1, src.lastIndexOf('/'));
    const isSelected=props.isSelected;

    const { getSessionInfo, kicked, onKickSession }=useContext(CamsContext);

    const kickLeech=(e, id)=>{
        e.preventDefault();
        e.stopPropagation();

        fetch(`/api/kickleech?sessionid=${id}`).then(async(result) => {
            if(result.ok){
                onKickSession(id);
            }
        });
    }

    return (
        <tr onClick={props.handleClick} className={isSelected ? 'selected':''}>
            <th scope='row'>{props.no + 1}</th>
            <td>{props[0]}</td>
            <td>{protocol}</td>
            <td>{ipport}</td>
            <td>{props[1].sourceReady ? 
                <i className="bi-camera-video-fill" style={{color: 'yellowgreen'}}/>
                :<i className="bi-camera-video-off-fill" style={{color: 'lightgrey'}}/>}
            </td>
            <td id={`pop-readers-${props.no}`}>
                {props[1].readers.length}
                {props[1].readers.length>0 &&
                    <UncontrolledPopover flip placement='right' target={`pop-readers-${props.no}`} trigger='hover'>
                        <PopoverHeader>
                            Leechers
                        </PopoverHeader>
                        <PopoverBody onClick={(e)=>{ e.preventDefault(); e.stopPropagation(); }}>
                            {props[1].readers.map((v, k)=>{
                                if(v && v.type === 'hlsMuxer'){
                                    return  <div key={k}>
                                                [{k}] HLS Muxer
                                            </div>
                                }
                                else{
                                    return  <div key={k} className={kicked.indexOf(v.id)>-1 ? styles.kicked:''}>
                                                {`[${v.id}] ` + getSessionInfo(v.id).src}
                                                <i onClick={(e)=>kickLeech(e, v.id)} className={`${styles.kickLeech} bi-x-square-fill`}/>
                                            </div>;
                                }
                            })}
                        </PopoverBody>
                    </UncontrolledPopover>}
            </td>
        </tr>
    );
}
