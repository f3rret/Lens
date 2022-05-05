import styles from '../styles/Home.module.css';
import { Form, Col, Row, Button } from 'reactstrap';
import { useMemo, useState } from 'react';

export default function Footer(props){

    const LABEL1='Restart core';
    const AWAIT_LABEL='Wait...';

    const BUTTON_READY = { backgroundColor: 'steelblue', borderColor: 'steelblue' };
    const BUTTON_INPROGRESS = { backgroundColor: 'dimgray', borderColor: 'dimgray' };

    const { isActive, onActivate } = props;
    const [ active, setActive ] = useState(isActive);
    const [ text1, setText1 ] = useState(LABEL1);
    const [ response1, setResponse1 ] = useState('');

    useMemo(() => {
        setActive(isActive);
    }, [isActive]);

    const tryRestart = () => {
        if( text1 === LABEL1 ){
            setText1(AWAIT_LABEL);
            
            fetch('/api/restartcore').then(res => {
                setTimeout(() => { setText1('Result: ' + res.statusText);
                    setTimeout(() => setText1(LABEL1), 2000);
                }, 2000);
            });
        }
    }

    return (<footer className={active ? `${styles.footer} ${styles.footerActive}`:styles.footer}>
                <Form className={styles.footerForm}>
                    <Row>
                        <a rel="noopener noreferrer" className={styles.footerSwitch} onClick={()=>{
                                setActive(!active);
                                onActivate();
                            }}>
                            <span className={styles.logo}>
                                <i className="bi-instagram"/>{' '}<span>Lens</span>
                            </span>
                        </a>
                    </Row>
                    {active && <Row style={{paddingLeft: '7rem'}}>
                                    <Col xs={4} style={{alignSelf: 'center'}}>Perform full restart rtsp-simple-server process: </Col>
                                    <Col xs={8}>
                                        <Button sm={2} style={ text1 === LABEL1 ? BUTTON_READY : BUTTON_INPROGRESS} onClick={tryRestart}>{text1}</Button>
                                    </Col>
                                </Row>}
                </Form>
            </footer>);  
}