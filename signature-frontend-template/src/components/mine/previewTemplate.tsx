import { message } from 'antd';
import axios, { AxiosError } from 'axios';
import { useEffect, useState } from 'react';
import { AppConfig } from '../../config/index.ts';

export const Preview_Template_Component = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [pdfsource, setpdfsource] = useState(null);

    useEffect(() => {
        try {
            fetchPDF();
        } catch {
            console.log('Fetching Logged In User Error');
        }
    }, []);

    const fetchPDF = async () => {
        try {
            messageApi.info('Request Generated');
            // const res = await axios.get('http://localhost:4001/api/template', {
            const res = await axios.get(`${AppConfig.backendURL}/api/template`, {
                headers: { 'reqid': window.location.pathname.split('/')[3] },
                withCredentials: true,
            });
            setpdfsource(res.data.pdfpath);
            if (res.data.status == "sent Successfully") {
                messageApi.info('Loaded Success');
            }
        }
        catch (error: any) {
            messageApi.destroy();
            messageApi.error(error?.response?.data?.status);
            console.log('Preview Request Error', error);
        }
    }
    return (
        <>
            {contextHolder}
            <iframe src={`${AppConfig.backendURL}/upload/${pdfsource}`} className='w-full h-screen'></iframe>
        </>
    )
}