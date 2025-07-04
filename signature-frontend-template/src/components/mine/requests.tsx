import { Input, Button, Drawer, Form, Space, Col, Row, message, Modal } from 'antd';
import { ReactNode, useEffect, useState } from 'react';
import { mainClient } from '../../store';
import CustomTable from '../CustomTable';
import { roles } from '../../libs/constants';
import MainAreaLayout from '../main-layout/main-layout';
import { Link } from 'react-router';
import axios, { AxiosError } from 'axios';
import RequiredButton from '../Buttons/Requests';
import { AppConfig } from '../../config/index.ts';

interface User {
    userId: string;
    name: string;
    email: string;
    phoneNumber: string;
    role: roles.officer | roles.reader;
}

interface ReqData {
    title: string;
    noofdocuments: number | ReactNode;
    rejecteddocuments: number | ReactNode;
    createdat: string;
    requeststatus: string;
    describe: string;
    action: ReactNode;
}

export const Search_component = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [UserLoggedIn, setUserLoggedIn] = useState<User | null>(null);

    const [form] = Form.useForm();
    const [reqdata, setreqdata] = useState<ReqData[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [currentRequestId, setCurrentRequestId] = useState<string>('');

    const [modalOpen, setModalOpen] = useState(false);
    const [employeeList, setEmployeeList] = useState<any[]>([]);
    const [selectedOfficer, setSelectedOfficer] = useState<string>('');

    const [reasonOpen, setReasonOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState<string>('');

    const [signs, setSigns] = useState<[]>([]);
    const [signatureModalOpen, setSignatureModalOpen] = useState(false);
    const [selectedSignature, setSelectedSignature] = useState<string>('');

    const showModal = async (requestId: string) => {
        try {
            setSignatureModalOpen(false);
            const allemployee = await axios.post(`${AppConfig.backendURL}/api/allemployee`, { reqid: requestId }, { withCredentials: true });
            if (allemployee.data.status === 'Please upload Data first') {
                messageApi.error(allemployee.data.status);
                return;
            }
            setEmployeeList(allemployee.data);
            setCurrentRequestId(requestId);
            setModalOpen(true);
            await fetchRequests();
        }
        catch (e: any) {
            messageApi.error(e?.response?.data?.status);
        }
    };

    const handleOk = async () => {
        if (!selectedOfficer || !currentRequestId) {
            messageApi.warning('Please select an officer and ensure request is set');
            return;
        }
        try {
            await axios.post(`${AppConfig.backendURL}/api/signatures/assignedTo`, {
                officerID: selectedOfficer,
                requestID: currentRequestId,
            }, { withCredentials: true });
            setModalOpen(false);
            messageApi.loading('Sending for signature...');
            setTimeout(async () => {
                await fetchRequests();
                messageApi.destroy();
                messageApi.info(`Sent to officer: ${selectedOfficer}`);
            }, 1500);
        } catch (error) {
            messageApi.error('Failed to send for signature');
        }
    };

    const handleCancel = () => {
        setModalOpen(false);
        setReasonOpen(false);
    };

    const fetchRequests = async () => {
        try {
            const res = await axios.get(`${AppConfig.backendURL}/api/requests`, { withCredentials: true });
            if (res) {
                const mappedData: ReqData[] = res.data.requestsArr.map((item: any) => ({
                    title: item.title,
                    noofdocuments: (
                        <Link to={'/dashboard/request/' + item._id}>
                            {item.Noofdocuments}
                        </Link>
                    ),
                    pendingdocuments:item.Noofdocuments-item.Signeddocuments-item.RejectedDocs,
                    signeddocuments:item.Signeddocuments,
                    rejecteddocuments: item.RejectedDocs,
                    createdat: new Date(item.createdAt).toUTCString(),
                    requeststatus: item.status,
                    describe: item.description,
                    action: (
                        <div className="flex" style={{ flexWrap: 'wrap' }}>
                            <RequiredButton
                                id={item._id}
                                role={res?.data?.role}
                                delegated={item.delegated}
                                status={item.status}
                                handleClone={handlereqcloning}
                                handleDelete={handlereqdeletion}
                                findAllOfficer={showModal}
                                handledelegate={handlereqdelegate}
                                handlerejectedAll={handlereqrejectedAll}
                                handlereqsign={handlereqsignALL}
                            />
                        </div>
                    ),
                }));
                setreqdata(mappedData);
            }
        } catch (error) {
            const err = error as AxiosError<{ error: string }>;
            messageApi.error(err.response?.data?.error || 'Something went wrong');
        }
    };

    const handlereqsignALL = async (reqidtosign: any) => {
        try {
            messageApi.info('Fetching Signatures...');
            const ans = await axios.get(`${AppConfig.backendURL}/api/signatures`, {
                withCredentials: true,
            });
            setSigns(ans.data.images);
            setCurrentRequestId(reqidtosign);
            setSignatureModalOpen(true);
        } catch (error) {
            messageApi.destroy();
            messageApi.error('Upload Signature First');
        }
    };

    const handlereqrejectedAll = async (reqidtoreject: any) => {
        setReasonOpen(true);
        setCurrentRequestId(reqidtoreject);
        if (!rejectReason.trim()) {
            messageApi.warning('Please provide a reason for rejection');
            return;
        }
        try {
            setReasonOpen(false);
            messageApi.loading('Sent to Reject');
            await axios.post(`${AppConfig.backendURL}/api/requests/reject`,
                { reqidtoreject: currentRequestId, rejectReason },
                { withCredentials: true }
            );
            setTimeout(async () => {
                await fetchRequests();
                messageApi.destroy();
                messageApi.info('Reject Success');
                setRejectReason('');
            }, 1500);
        } catch (error) {
            console.log(error);
            messageApi.error('Failed to reject request');
        }
    };

    const handlereqdelegate = async (reqidtodelegate: any) => {
        try {
            messageApi.loading('Sent to Delegate');
            const res = await axios.post(`${AppConfig.backendURL}/api/requests/delegate`, { reqidtodelegate }, { withCredentials: true });
            if (res.data.status === "Delegate Successfully") {
                setTimeout(async () => {
                    await fetchRequests();
                    messageApi.destroy();
                    messageApi.info('Delegate Success');
                }, 1500);
            }
        } catch (error) {
            messageApi.error('Failed to delegate request');
        }
    };

    const handlereqcloning = async (reqidtoclone: any) => {
        try {
            const res = await axios.post(`${AppConfig.backendURL}/api/requests/clone`, { reqidtoclone }, { withCredentials: true });
            if (res.data.status === "Cloned Successfully") {
                messageApi.info('Cloned Success');
                await fetchRequests();
            }
        } catch (error) {
            messageApi.error('Failed to clone request');
        }
    };

    const handlereqdeletion = async (reqidtodel: any) => {
        try {
            const res = await axios.delete(`${AppConfig.backendURL}/api/requests`, { headers: { reqidtodel }, withCredentials: true });
            if (res.data.status === "Deleted Successfully") {
                await fetchRequests();
                messageApi.info('Deleted Success');
            }
        } catch (error) {
            messageApi.error('Failed to delete request');
        }
    };

    useEffect(() => {
        const fetchUserAndRequests = async () => {
            try {
                const response = await mainClient.getSession();
                setUserLoggedIn(response);
                await fetchRequests();
            } catch {
                console.log('Fetching Logged In User Error');
            }
        };
        fetchUserAndRequests();
    }, []);

    const columns = [
        { title: 'Title', dataIndex: 'title', key: 'title' },
        { title: 'No of Documents', dataIndex: 'noofdocuments', key: 'noofdocuments' },
        { title: 'Signed Documents', dataIndex: 'signeddocuments', key: 'signeddocuments' },
        { title: 'Pending Documents', dataIndex: 'pendingdocuments', key: 'pendingdocuments' },
        { title: 'Rejected Documents', dataIndex: 'rejecteddocuments', key: 'rejecteddocuments' },
        { title: 'Created At', dataIndex: 'createdat', key: 'createdat' },
        { title: 'Request Status', dataIndex: 'requeststatus', key: 'requeststatus' },
        { title: 'Action', dataIndex: 'action', key: 'action' },
    ];

    const handleopendrawer = () => {
        setIsDrawerOpen(!isDrawerOpen);
    };

    const resetFormState = () => {
        setIsDrawerOpen(false);
        setTimeout(() => form.resetFields(), 100);
    };

    const handlesearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rows = document.querySelectorAll('.ant-table-row');
        if (!e.target.value.trim()) {
            rows.forEach((elem) => {
                elem.setAttribute('style', 'background-color:white;');
                elem.classList.remove('hidden');
            });
            return;
        }
        rows.forEach((elem) => {
            const cellText =
                elem.querySelectorAll('.ant-table-cell')[1]?.textContent?.toLowerCase() || '';
            if (cellText.includes(e.target.value.toLowerCase())) {
                elem.classList.add('table-row');
                elem.setAttribute('style',
                    'font-weight:900; font-size:1.2vmax;color:blue;');
            } else {
                elem.classList.remove('table-row');
                elem.setAttribute('style', 'background-color:white;');
            }
        });
    };

    const handleSubmission = async () => {
        try {
            const input = document.querySelector<HTMLInputElement>('input[type="file"]');
            if (!input?.files?.[0]) {
                messageApi.error('No Docx Template selected');
                return;
            }
            let value = await form.validateFields();
            value = {
                ...value,
                uploadfile: input.files[0],
            };
            const res = await axios.post(`${AppConfig.backendURL}/api/requests`, value, {
                headers: { 'Content-Type': 'multipart/form-data' },
                withCredentials: true,
            });
            messageApi.success(res.data.success);
            await fetchRequests();
            resetFormState();
        } catch (error: any) {
            if (axios.isAxiosError(error)) {
                messageApi.error(error?.response?.data?.error);
            } else {
                if (error?.errorFields) {
                    error.errorFields.forEach((item: any) => {
                        messageApi.error(item.errors);
                    });
                }
            }
        }
    };

    const ReaderView = () => <p>Reader <span className="text-blue-800">({UserLoggedIn?.name})</span> Dashboard</p>;
    const OfficerView = () => <p>Officer <span className="text-blue-800">({UserLoggedIn?.name})</span> Dashboard</p>;

    const SearchView = () => (
        <>
            <div>
                <Input placeholder="Search..." size="large" onChange={handlesearch} />
            </div>
            <div>
                <Button type="primary" size="large" onClick={handleopendrawer}>
                    New Request for Signature
                </Button>
            </div>
        </>
    );

    return (
        <>
            {contextHolder}
            <Modal
                title="Assign Officer to Signature"
                open={modalOpen}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Form layout="vertical">
                    <Form.Item label="Select Officer">
                        <select
                            value={selectedOfficer}
                            onChange={(e) => setSelectedOfficer(e.target.value)}
                            style={{ width: '100%', padding: '8px' }}
                        >
                            <option value="">-- Select Officer --</option>
                            {employeeList.map((elem) => (
                                <option key={elem.id} value={elem.id}>
                                    {elem.name}
                                </option>
                            ))}
                        </select>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Reason to Reject"
                open={reasonOpen}
                // onOk={handlereqrejectedAll}
                onOk={() => handlereqrejectedAll(currentRequestId)}
                onCancel={handleCancel}
            >
                <Form layout="vertical">
                    <Form.Item label="Reason for Rejection">
                        <Input
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Enter reason for rejection"
                        />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title="Select Signature To Attach"
                open={signatureModalOpen}
                onOk={async () => {
                    if (!selectedSignature) {
                        messageApi.warning('Please select a signature before signing');
                        return;
                    }

                    try {
                        messageApi.loading('Signing...');
                        const res = await axios.post(`${AppConfig.backendURL}/api/requests/signAll`, {
                            reqidtosign: currentRequestId,
                            selectedSignature,
                        }, { withCredentials: true });

                        if (res.data.status === "Signed Successfully") {
                            setTimeout(async () => {
                                await fetchRequests();
                                messageApi.destroy();
                                messageApi.success('Signed Successfully');
                                setSignatureModalOpen(false);
                                setSelectedSignature('');
                                setCurrentRequestId('');
                            }, 1500);
                        } else {
                            messageApi.error(res.data.status || 'Failed to sign');
                        }
                    } catch (error) {
                        messageApi.error('Check Signatures Uploaded or not');
                    }
                }}
                onCancel={() => {
                    setSignatureModalOpen(false);
                    setSelectedSignature('');
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
            <MainAreaLayout
                title={UserLoggedIn?.role === 3 ? <ReaderView /> : <OfficerView />}
                extra={<SearchView />}
            >
                <CustomTable
                    columns={columns}
                    data={reqdata}
                    serialNumberConfig={{ name: '', show: true }}
                />
                <Drawer
                    title="Add Signature"
                    placement="right"
                    width={500}
                    open={isDrawerOpen}
                    onClose={resetFormState}
                    extra={
                        <Space>
                            <Button onClick={handleopendrawer}>Cancel</Button>
                            <Button onClick={handleSubmission} type="primary">
                                Submit
                            </Button>
                        </Space>
                    }
                >
                    <Form layout="vertical" form={form}>
                        <h1 className="font-bold">Note :</h1>
                        <ol className="list-decimal pl-5 font-bold">
                            <li>Title Should be Unique</li>
                            <li>Example add time</li>
                        </ol>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="Name"
                                    rules={[{ required: true, message: 'Please enter user name' }]}
                                >
                                    <Input placeholder="Please enter user name" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <h1 className="font-bold">Note :</h1>
                        <ol className="list-decimal pl-5 font-bold">
                            <li>Only Word files are allowed to upload.</li>
                            <li>File must include Court, QR Code, and Signature Field.</li>
                            <li>Single File Upload Accepted Only.</li>
                        </ol>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="uploadfile"
                                    label="Upload File"
                                    rules={[{ required: true, message: 'Please submit a file' }]}
                                >
                                    <Input
                                        type="file"
                                        accept=".docx,.doc,application/msword,application/vnd.openxmlformats-officedocuments.wordprocessingml.document"
                                        size="large"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={16}>
                            <Col span={24}>
                                <Form.Item
                                    name="description"
                                    label="Description"
                                    rules={[
                                        { required: true, message: 'Please enter description' },
                                    ]}
                                >
                                    <Input.TextArea rows={4} placeholder="Enter description" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Form>
                </Drawer>
            </MainAreaLayout>
        </>
    );
};