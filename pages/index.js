import Head from 'next/head'
import styles from '../styles/Home.module.css'
import LeftPanel from './leftpanel';
import RightPanel from './rightpanel';
import Footer from './footer';
import { Alert, Button } from 'reactstrap';
import { CamsContext } from './lib/context';
import Script from 'next/script';

import useSWR from 'swr';
import { useState, useMemo, useCallback } from 'react';

export default function Home() {

  const [ selected, setSelected ] = useState({});
  const [ mainActive, setMainActive ] = useState(true);
  const jsonFetcher = (...args) => fetch(...args).then(res => res.json());
  const { data, error, mutate } = useSWR('api/cams', jsonFetcher, { refreshInterval: 10000 });
  const err = error || (data && data.error);

  const onSelect = ({key, value, editMode}) => {
      if( !key && editMode ){
        setSelected({editMode});
      }
      else{
        setSelected({key, value, editMode});
      }
  };

  const onChangeList = ()=>{
    return mutate('api/cams');
  }

  const [kicked, setKicked] = useState([]);
  const onKickSession = (id) =>{
    setKicked([...kicked, id]);
  }

  const sessions = useMemo(()=>{
    const sess = {};

    if( data && data.items && data.sessions && data.sessions.items ){
      Object.entries(data.items).map((v, k)=>{
        v[1].readers.forEach((value) => {
          sess[value.id]={cam: v[0]};
        });
      });

      Object.entries(data.sessions.items).forEach((v, k) => {
        if(!sess[v[0]])sess[v[0]]={cam: 'unknown'};
        sess[v[0]].src=v[1].remoteAddr;
      });

      return sess;
    }
    else{
      return {};
    }
  }, [data]);

  const getSessionInfo = useCallback((sessid)=>{
    return sessions[sessid] || {cam: 'unknown'};
  }, [sessions]);


  const switchMainActive = () => {
    setMainActive(!mainActive);
  } 

  const [coreState, setCoreState] = useState(0);
  const tryRestart = () => {
    if(coreState === 0){
      setCoreState(1);

      fetch('/api/restartcore').then(res => {
        setTimeout(()=>{setCoreState(0); mutate('api/cams')}, 2000);
      });
    }
  }

  return (
    <>
      <Script src='/hls.min.js' strategy='afterInteractive'/>
      <div className={styles.container}>
        <Head>
          <title>Lens control panel</title>
          <link rel="icon" href="/favicon.ico" />
          <link
                rel="preload"
                href="/Inter.woff2"
                as="font"
                crossOrigin=""
                type="font/woff2"
              />
        </Head>
        
        <main className={mainActive ? styles.main : `${styles.main} ${styles.mainInactive}`} onClick={() => mainActive ? null : switchMainActive()}>
          {err && err.errno === 'ECONNREFUSED' && 
            <Button sm={2} className={styles.startCoreButton} onClick={tryRestart}>{coreState === 1 ? 'Starting...': 'Start core server'}</Button>   }
          {err && err.errno !== 'ECONNREFUSED' && <Alert color='danger' fade={false}>
                  {Object.keys(err).length ? JSON.stringify(err) : 'Core server unavailable'}
                </Alert>}
          {!err && <CamsContext.Provider value={{ cams: data, selected, onSelect, onChangeList, getSessionInfo, onKickSession, kicked }}>
                    <LeftPanel />
                    <RightPanel />
                  </CamsContext.Provider>}
        </main>
        <Footer isActive={!mainActive} onActivate={switchMainActive}/>
      </div>
    </>
  )
}
