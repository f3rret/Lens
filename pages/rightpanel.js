import styles from '../styles/Home.module.css'

import CamCard from './camcard';
import Statistics from './statistics';
import Sessions from './sessions';

import { CamsContext } from './lib/context';
import { useContext } from 'react';

export default function RightPanel(){
    
    const { selected, cams } = useContext(CamsContext);
    const showCard = selected && ( selected.key || selected.editMode);
    const showSessions = cams && cams.sessions && cams.sessions.items;

    return (
        <div className={styles.rightPanel}>
            { showCard && <CamCard /> }
            { !showCard && <Statistics /> }
            { !showCard && showSessions && <Sessions /> }
        </div>
    );
}

