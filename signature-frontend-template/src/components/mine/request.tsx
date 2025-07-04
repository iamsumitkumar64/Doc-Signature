import { Button, Form, Row, Col, Input, message, Modal } from 'antd';
import { useEffect, useState } from 'react';
import CustomTable from '../CustomTable';
import MainAreaLayout from '../main-layout/main-layout';
import RequiredButton from '../Buttons/Request';
import { mainClient } from '../../store';
import axios from 'axios';
import { AppConfig } from '../../config/index.ts';

interface headersColumn {
    title: string;
    dataIndex: string;
    key: string;
}

export const Request_Component = () => {
    const [form] = Form.useForm();
    const [messageApi, contextHolder] = message.useMessage();
    const [columns, setColumns] = useState<headersColumn[]>([]);
    const [RowsData, setRowsData] = useState([]);
    const [LoggedInUser, setLoggedInUser] = useState<number | undefined>(undefined);

    const [signs, setSigns] = useState<string[]>([]);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [selectedSignature, setSelectedSignature] = useState<string>('');
    const [currentSigningId, setCurrentSigningId] = useState<string>('');

    function showData(allBulkData: any, role?: number) {
        if (!allBulkData) {
            messageApi.info("No document has been Uploaded yet");
            return;
        }

        let headers = [];
        let BulkData = allBulkData.data;

        for (let key in allBulkData.headers['0']) {
            headers.push({
                title: allBulkData.headers['0'][key],
                key: key,
                dataIndex: key,
            });
        }

        headers.push(
            { title: "Action Date", dataIndex: 'actiondate', key: 'actiondate' },
            { title: "Status", dataIndex: 'status', key: 'status' },
            { title: 'Action', key: 'action', dataIndex: 'action' }
        );
        for (let i = 0; i < BulkData.length; i++) {
            BulkData[i]['actiondate'] = BulkData[i]['signDate'] === '' ? 'Not Signed Yet' : new Date(Number(BulkData[i]['signDate'])).toUTCString();

            BulkData[i]['action'] = (
                <RequiredButton
                    id={BulkData[i]._id}
                    role={role}
                    status={BulkData[i]['status']}
                    handlereject={handleReject}
                    handlesign={handleSign}
                />
            );
        }
        setColumns(headers);
        setRowsData(BulkData || []);
    }

    async function handleSign(idtoSign: string) {
        try {
            messageApi.info('Fetching Signatures...');
            const ans = await axios.get(`${AppConfig.backendURL}/api/signatures`, {
                withCredentials: true,
            });
            if (ans.status === 200) {
                const signatures = ans.data;
                setSigns(signatures.images);
            }
            setCurrentSigningId(idtoSign);
            setSignatureModalOpen(true);
        } catch (error: any) {
            console.error('Error fetching signatures:', error);
            messageApi.error('Failed to fetch signatures');
        }
    }

    async function handleReject(idtoSign: string) {
        try {
            messageApi.info(`Rejecting ID: ${idtoSign}`);
            const response = await axios.post(
                `${AppConfig.backendURL}/api/requests/rejectone`,
                { onerequestID: idtoSign },
                { withCredentials: true }
            );

            if (response.data === 'Rejected successfully') {
                if (LoggedInUser !== undefined) {
                    await fetchUserAndData(LoggedInUser);
                }
                messageApi.success(`Rejected successfully: ${idtoSign}`);
            }
        } catch (error) {
            console.error('Error rejecting signature:', error);
            messageApi.error('Failed to reject document');
        }
    }

    const getRole = async (): Promise<number | undefined> => {
        const response = await mainClient.getSession();
        const role = response?.role;
        setLoggedInUser(role);
        return role;
    };

    const fetchUserAndData = async (role?: number) => {
        try {
            const res = await axios.get(`${AppConfig.backendURL}/api/bulkdataApi`, {
                headers: { requestId: window.location.pathname.split('/')[3] },
                withCredentials: true,
            });
            showData(res.data.data, role);
            messageApi.info('Download Template if Needed from Corner');
        } catch (e) {
            console.error(e);
            messageApi.error('Error Fetching (User or Data)');
        }
    };

    const handleSubmission = async () => {
        try {
            const input = document.querySelector<HTMLInputElement>('input[type="file"]');
            if (!input?.files?.[0]) {
                messageApi.error('Select File to Upload');
                return;
            }

            let value = await form.validateFields();
            value = {
                ...value,
                uploadfile: input.files[0],
            };

            const res = await axios.post(`${AppConfig.backendURL}/api/bulkdataApi`, value, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    requestId: window.location.pathname.split('/')[3],
                },
                withCredentials: true,
            });

            if (res.data.success) {
                messageApi.success(res.data.success);
            }

            if (LoggedInUser !== undefined) {
                await fetchUserAndData(LoggedInUser);
            }
        } catch (err: any) {
            console.error(err);
            messageApi.error('File upload failed');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            const role = await getRole();
            if (role !== undefined) {
                await fetchUserAndData(role);
            }
        };
        fetchData();
    }, []);

    const ReaderView = () => <p>Dashboard</p>;

    return (
        <>
            {contextHolder}
            <Modal
                title="Select Signature To Attach"
                open={signatureModalOpen}
                onOk={async () => {
                    if (!selectedSignature) {
                        messageApi.error("Please select a signature before confirming.");
                        return;
                    }
                    try {
                        const response = await axios.post(
                            `${AppConfig.backendURL}/api/requests/signone`,
                            { onerequestID: currentSigningId, selectedSignature },
                            { withCredentials: true }
                        );

                        if (response.data === 'Signed successfully') {
                            if (LoggedInUser !== undefined) {
                                await fetchUserAndData(LoggedInUser);
                            }
                            messageApi.success(`Signed successfully: ${currentSigningId}`);
                        }
                    } catch (error: any) {
                        console.error('Error signing document:', error);
                        messageApi.error('Failed to sign document');
                    } finally {
                        setSignatureModalOpen(false);
                        setSelectedSignature('');
                        setCurrentSigningId('');
                    }
                }}
                onCancel={() => {
                    setSignatureModalOpen(false);
                    setSelectedSignature('');
                    setCurrentSigningId('');
                }}
            >
                <div className="flex flex-wrap gap-4 justify-center">
                    {signs.map((url) => (
                        <div
                            key={url}
                            onClick={() => setSelectedSignature(url)}
                            style={{
                                border: selectedSignature === url ? '3px solid blue' : '1px solid #ccc',
                                padding: '4px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                            }}
                        >
                            <img
                                src={`http://localhost:4001/upload/${url}`}
                                alt="signature"
                                width={130}
                                height={130}
                                style={{ borderRadius: '8px' }}
                            />
                        </div>
                    ))}
                </div>
            </Modal>
            <MainAreaLayout title={<ReaderView />} extra={<></>}>
                <Form layout="vertical" form={form}>
                    <Row gutter={24} className="flex flex-col justify-between bg-gray-500" align={'middle'}>
                        <Col span={16} className="flex flex-row gap-4">
                            <Button type="primary" onClick={handleSubmission}>
                                Bulk Upload
                            </Button>
                            <Form.Item
                                rules={[{ required: true, message: 'Please select a file' }]}
                            >
                                <Input
                                    type="file"
                                    accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                                    size="large"
                                />
                            </Form.Item>
                        </Col>
                        <Col>
                            <a href="../../../public/sample_template.docx" download>
                                <Button type="default">
                                    Download Template
                                </Button>
                            </a>
                        </Col>
                    </Row>
                </Form>

                <CustomTable columns={columns} data={RowsData} serialNumberConfig={{ name: '', show: true }} />
            </MainAreaLayout>
        </>
    );
};