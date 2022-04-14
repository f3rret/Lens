import styles from '../styles/Home.module.css';
import CamsList from './camslist';
import { Button, Spinner, Alert } from 'reactstrap';
import { CamsContext } from './lib/context';
import { useContext } from 'react';

export default function LeftPanel(){

    const { onChangeList, onSelect, selected, cams } = useContext(CamsContext);

    const handleAdd=(e)=>{
        e.preventDefault();
        onSelect({ key: '', editMode: true })
    }
    const handleRemove= async (e)=>{
        e.preventDefault();
        
        const response = await fetch('/api/deletecam', {
            body: JSON.stringify({ cam_name: selected.value[0] }),
            headers: {
                'Content-Type': 'application/json',
            },
            method: 'POST'
        });

        const result = await response.json();

        if(!result.err){
            await onChangeList().then(()=>onSelect({}));
        }
    }

    return(<>
            {!cams && <Spinner>Loading...</Spinner>}
            {cams && <div className={styles.leftPanel}>
                {cams.items && !Object.keys(cams.items).length && <Alert color='info' fade={false}>You have not any cams yet. Click 'Add' button to create new one.</Alert>}
                {cams.items && Object.keys(cams.items).length > 0 && <CamsList />}
                <div className={styles.camsListButtons}>
                    <Button onClick={handleAdd}>Add</Button>
                    {selected && selected.key && <Button onClick={handleRemove}>Remove</Button>}
                </div>
            </div>}
        </>);

}