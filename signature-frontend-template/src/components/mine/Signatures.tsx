import { Button, Form, Row, Input, Image, message } from 'antd';
import { roles } from '../../libs/constants';
import { useEffect, useState } from 'react';
import { mainClient } from '../../store';
import MainAreaLayout from '../main-layout/main-layout';
import axios from 'axios';
import { AppConfig } from '../../config/index.ts';

interface User {
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: roles.officer | roles.reader;
}

export const Sign_Component = () => {
    const [form] = Form.useForm();
    const [userData, setuserData] = useState<User | null>(null);
    const [images, setImages] = useState([]);
    const [messageApi, contextHolder] = message.useMessage();

    const fetchSignature = async () => {
        let res = await axios.get(`${AppConfig.backendURL}/api/signatures`, {
            withCredentials: true,
        });
        setImages(res.data.images);
    }

    useEffect(() => {
        try {
            const fetcheduserData = async () => {
                const response = await mainClient.getSession();
                setuserData(response);
            };
            fetcheduserData();
            fetchSignature();
        }
        catch {
            console.log('Fetching User Error');
        }
    }, []);

    const ReaderView = () => (<p><span className='text-blue-800'>({userData?.name})</span> Signature Management</p>);
    const OfficerView = () => (<p><span className='text-blue-800'>({userData?.name})</span> Signature Management</p>);
    const handleSubmission = async () => {
        const submitdata = document.querySelector<HTMLInputElement>('input[type="file"]');
        const realfile = submitdata?.files?.[0];
        if (!realfile) {
            console.error("No file selected");
            // alert('No file selected');
            messageApi.error('No Image file selected');
            return;
        }
        let value = await form.validateFields();
        value = {
            ...value,
            uploadfile: realfile
        };
        await axios.post(`${AppConfig.backendURL}/api/signatures`, value, {
            headers: { 'Content-Type': 'multipart/form-data', },
            withCredentials: true,
        });
        fetchSignature();
    };
    return (
        <>
            {contextHolder}
            <MainAreaLayout
                title={userData?.role == 3 ? <ReaderView /> : <OfficerView />}
            ><Form layout="vertical" form={form}>
                    <Row gutter={16} className='flex flex-row m-auto align-middle justify-around bg-gray-500 rounded-2xl' align={'middle'}>
                        {/* <Col span={24}> */}
                        <Button color='primary' variant="outlined" onClick={handleSubmission}>Add Signature</Button>
                        <Form.Item
                            name="uploadfilesignature"
                            label="Upload Signature File"
                            rules={[{ required: true, message: 'Please submit files' }]}
                        >
                            <Input type='file' accept='image/*' size='large'></Input>
                        </Form.Item>
                        {/* </Col> */}
                    </Row>
                </Form> <h1 style={{ fontSize: '2vmax', fontWeight: '500', marginBottom: '1.5vmax' }}>Signature Library</h1>
                <div className="bg-gray-400 rounded-[2vmax] p-6 flex flex-wrap gap-4 justify-start items-start">
                    {images.map(url => (
                        <Image
                            src={`http://localhost:4001/upload/${url}`}
                            width={130}
                            height={130}
                            key={url}
                            alt={`signature-${url}`}
                            className="object-cover rounded-2xl"
                        />
                    ))}
                </div>
            </MainAreaLayout>
        </>
    );
};