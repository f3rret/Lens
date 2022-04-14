import styles from '../styles/Home.module.css';
import { Spinner, Card, CardHeader, CardBody, Form, FormGroup, Input, Label, Button, Col, Row, UncontrolledTooltip } from 'reactstrap';
import useSWRImmutable from 'swr';
import { useRef, useMemo, useState, useEffect, useContext, useCallback } from 'react';
import { CamsContext } from './lib/context';

export default function CamCard(){
 
    const { selected, onSelect, cams, onChangeList } = useContext(CamsContext);
    const fetcher = (...args) => fetch(...args).then(res => res.json());
    const { data, mutate } = useSWRImmutable(selected.key ? 'api/caminfo?name='+ selected.key : null, fetcher);
    const [ edited, setEdited ] = useState(selected.editMode);

    const initCams=()=>{
        
        let cam_fullurl = selected.value ? selected.value[1].conf.source : '';
        if ( cam_fullurl == 'publisher' ){
            const line = selected.value[1].conf.runOnDemand.split(' ');
            cam_fullurl = line[2];
        }
        
        const url_arr = cam_fullurl ? /^(\w*):\/\/(\w*):(\w*)@(\S*)$/.exec(cam_fullurl) : [];

        return {
            cam_fullurl,
            cam_name: selected.value ? selected.value[0] : '',
            src_username: url_arr && url_arr.length > 2 ? url_arr[2] : '',
            src_password: url_arr && url_arr.length > 3 ? url_arr[3] : '',
            cam_url: url_arr && url_arr.length > 4 ? url_arr[1]+'://'+url_arr[4] : '',
            cam_model: data && data.model ? data.model : '',
            isUrlCorrect: true,
            isNameCorrect: true
        }
    };
    const [ fields, setFields ] = useState(initCams);
    const hls = useRef(null);

    const cam_video = useCallback( async (video) => {
        if(selected.value && selected.value[0] && video){
            if(hls.current){
                hls.current.stopLoad();
                hls.current.detachMedia();
                hls.current.destroy();
            }

            const inst = new Hls();
            inst.on(Hls.Events.FRAG_BUFFERED, (evname, dt) => {
                inst.net_bitrate = parseFloat(Math.round(8 * dt.stats.total / (dt.stats.loading.end - dt.stats.loading.start))/1024).toFixed(2);
                inst.net_latency = Math.round(dt.stats.loading.first - dt.stats.loading.start);
            });

            inst.loadSource(`http://${window.location.hostname}:8888/${selected.value[0]}/index.m3u8`);
            inst.attachMedia(video);
 
            hls.current=inst;
        }
    }, [fields.cam_fullurl, selected]);

    const getHls = useMemo(()=>{
        return hls.current;
    }, [hls.current]);

    const isRTSP = useMemo(() => {
        return fields.cam_model.toLowerCase().indexOf('d-link') == -1;
    }, [fields.cam_model]);


    useMemo(() => {
        if( data || !selected.key ){
            setFields(initCams);
        }
        else if(data && data.model !== fields.cam_model){
            setFields(fields=>({...fields, cam_model: data.model}));
        }
        if( edited !== selected.editMode ){
            setEdited(selected.editMode);
        }
    }, [data]);

    /*useEffect(()=>{
        if( data || !selected.key ){
            setFields(initCams);
        }
        if( edited !== selected.editMode ){
            setEdited(selected.editMode);
        }
        
    }, [selected]);*/

    useEffect(()=>{
        return ()=>{
            if(hls.current){
                hls.current.stopLoad();
                hls.current.detachMedia();
                hls.current.destroy();
            }
        }
    }, []);

    if( selected.key && !data ){
        return(<Spinner/>);
    }

    const handleClose = (e)=>{
        onSelect({});
    }

    const handleEdit = (e)=>{
        e.preventDefault();

        if(!selected.key){
            onSelect({});
        }
        else{
            setFields(initCams);
            setEdited(!edited);
        }
    }

    const handleSubmit=async (e)=>{
        e.preventDefault();
        
        const regexp = isRTSP ? new RegExp(/^rtsp:\/{2}([^@:\s])+:\d+\/\S*$/) : new RegExp(/^http:\/{2}([^@:\s])+(:\d+)?\/\S*$/);
        const isUrlCorrect = regexp.test(fields.cam_url);

        if(!isUrlCorrect){
            setFields(fields=>({...fields, isUrlCorrect}));
            return false;
        }

        const sql_camid = data ? data.name : undefined;
        if(!sql_camid || sql_camid!==fields.cam_name){
            if(cams.items){
                if(Object.keys(cams.items).indexOf(fields.cam_name)>-1){
                    setFields(fields=>({...fields, isNameCorrect: false}));
                    return false;
                }
            }
        }

        const JSONdata = JSON.stringify({...fields, sql_camid});
        const response = await fetch('/api/updatecam', {
            body: JSONdata,
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST'
        });

        const result = await response.json();

        if(!result.err){
            if(selected.key){
                await mutate();
            }
            await onChangeList().then((result)=>{
                Object.entries(result.items).some((v, k)=>{
                    if(v[0] === fields.cam_name){
                        onSelect({ key: fields.cam_name, value: v, editMode: true });
                        return true;
                    }
                });
            });
            
        }
    }

    const handleInputChange=(e)=>{
        e.preventDefault();

        let isCorrect=true;
        let isUrlCorrect=fields.isUrlCorrect;
        let isNameCorrect=fields.isNameCorrect;

        if(e.target.name==='cam_name'){
            const regexp=new RegExp(/^[a-z,\d,-]*$/);
            isCorrect=regexp.test(e.target.value);
            isNameCorrect=true;
        }
        else if(e.target.name==='cam_url'){
            isUrlCorrect=true;
        }
        else if(e.target.name==='src_username' || e.target.name==='src_password'){
            const regexp=new RegExp(/^\w*$/);
            isCorrect=regexp.test(e.target.value);
        }
        if(isCorrect){
            setFields(fields=>({...fields, [e.target.name]: e.target.value, isUrlCorrect, isNameCorrect}));
        }
    }

    return (
        <Card className={styles.camCard}>
            <CardHeader tag='h5'>{selected.key ? selected.value[0]:'Add new cam'}</CardHeader>
            <CardBody>
                <Form inline onSubmit={handleSubmit}>
                    {selected.value && fields.cam_name && fields.cam_url && <Row style={{marginBottom: '2rem'}}>
                        <video controls ref={cam_video}></video>
                        <Col><FPSInfo hls={getHls}/></Col>
                    </Row>}
                    <Row>
                        <FormGroup row>
                            <Label for="cam_name" xs={3}>
                                Camera name
                            </Label>
                            <Col xs={9}>
                                <Input
                                    id="cam_name"
                                    name="cam_name"
                                    placeholder="new-camera-name"
                                    invalid={!fields.isNameCorrect}
                                    type="text"
                                    disabled={!edited}
                                    value={fields.cam_name}
                                    onChange={handleInputChange}
                                />
                            </Col>
                        </FormGroup>
                        
                        <FormGroup row>
                            <Label for="cam_model" xs={3}>
                                Model
                            </Label>
                            <Col xs={9}>
                                <Input
                                        id="cam_model"
                                        name="cam_model"
                                        type="select"
                                        disabled={!edited}
                                        onChange={handleInputChange}
                                        placeholder="pick proper model"
                                        value={fields.cam_model}
                                    >
                                    <option></option>
                                    <option>D-Link 930L</option>
                                    <option>HUV</option>
                                    <option>LTV</option>
                                </Input>
                            </Col>
                        </FormGroup>

                        <FormGroup row>
                            <Label for="cam_url" xs={3}>
                                Source URL
                            </Label>
                            <Col xs={9}>
                                <Input
                                    id="cam_url"
                                    name="cam_url"
                                    invalid={!fields.isUrlCorrect}
                                    placeholder={isRTSP ? "rtsp://ip:port/path":"http://ip:port/path"}
                                    type="text"
                                    value={fields.cam_url}
                                    disabled={!edited}
                                    onChange={handleInputChange}
                                />
                                {edited && fields.cam_model && 
                                <UncontrolledTooltip className={styles.camCardTooltip} target="cam_url" placement="bottom"><b>For example</b> {isRTSP ? "rtsp://192.168.5.60:554/profile1":"http://192.168.5.90:8585/video.cgi"}</UncontrolledTooltip>}
                            </Col>
                        </FormGroup>

                        <FormGroup row>
                            <Label for="src_username" xs={3}>
                                Source login
                            </Label>
                                <Col xs={5}>
                                    <Input
                                        id="src_username"
                                        name="src_username"
                                        placeholder="username"
                                        type="text"
                                        value={fields.src_username}
                                        disabled={!edited}
                                        onChange={handleInputChange}
                                    />
                                </Col>
                                <Col xs={4}>
                                    <Input
                                        id="src_password"
                                        name="src_password"
                                        placeholder="password"
                                        type="password"
                                        value={fields.src_password}
                                        disabled={!edited}
                                        onChange={handleInputChange}
                                    />
                                </Col>
                        </FormGroup>
                    </Row>
                    
                    <div className={styles.camCardButtons}>
                        {edited && fields.cam_name && fields.src_username &&
                             <Button sm={2} type='submit'>Save</Button>}
                        <Button sm={2} onClick={handleEdit}>{edited ? 'Cancel':'Edit'}</Button>
                        {!edited && <Button sm={2} onClick={handleClose}>Close</Button>}
                    </div>
                </Form>
            </CardBody>
        </Card>
    );
}


function FPSInfo(props){
    const [ fps, setFps ] = useState(null);

    useInterval(()=>{
        const video = props.hls ? props.hls.media : null;

        if(video){
            const quality = video.getVideoPlaybackQuality();
            const newInfo = {
                dt: new Date(),
                total: quality.totalVideoFrames,
                dropped: quality.droppedVideoFrames
            };

            if(fps){
                const dtDiff = newInfo.dt.getTime() - fps.dt.getTime();
                const totalDiff = newInfo.total - fps.total;
                const droppedDiff = newInfo.dropped - fps.dropped;
                newInfo.fps = parseFloat(1000 * (totalDiff - droppedDiff) / dtDiff).toFixed(2);
            }
            
            setFps(newInfo);
        }
    }, 1000);

    return (
        <>
        FPS: { fps && fps.fps && fps.fps > 0 ? fps.fps : 0 }
        <br/>
        DFC: { fps && fps.dropped && fps.dropped > 0 ? fps.dropped : 0 }
        <br/>
        Net rate: { props.hls && props.hls.net_bitrate ? `${props.hls.net_bitrate} KiB/s` : 0 }
        <br/>
        Latency: { props.hls && props.hls.net_latency ? `${props.hls.net_latency} ms` : 0 }
        </>
    );
}


function useInterval(callback, delay) {
    const savedCallback = useRef();
  
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
}