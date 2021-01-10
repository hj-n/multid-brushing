import React, { useEffect } from 'react';
import axios from 'axios';

const Brushing = (props) => {

    useEffect(async () => {
        const url = props.url;
        const params = {
            dataset: props.dataset,
            method:  props.method,
            sample: props.sample,
        }
        const result = await axios.get(url + "init", { params: params });
        if (result.status === 400) { alert('No such dataset exists!!'); return; }

        const density = await axios.get(url + "density", { parmas : params });
        console.log(density)

        
    }, [props]);



    return (
        <div>
            BLabla
        </div>
    );
}

export default Brushing;