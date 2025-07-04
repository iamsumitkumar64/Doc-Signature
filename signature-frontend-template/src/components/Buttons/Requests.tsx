import { Button } from "antd";
import React from "react";
import { Link } from "react-router";
import axios from "axios";
import { AppConfig } from "../../config/index.ts";
import { useState } from "react";

interface ButtonInterfaceProps {
    id: string | null;
    delegated?: boolean;
    role?: 2 | 3;
    status?: 'Draft' | 'Delegated' | 'Signed' | 'Pending' | 'Rejected' | 'Submited';
    handleClone?: (requestID: string) => Promise<void>;
    handleDelete?: (requestID: string) => Promise<void>;
    findAllOfficer?: (requestID: string) => Promise<void>;
    handledelegate?: (requestID: string) => Promise<void>;
    handlerejectedAll?: (requestID: string) => Promise<void>;
    handlereqsign?: (requestID: string) => Promise<void>;
}

const RequiredButton: React.FC<ButtonInterfaceProps> = ({ id, role, delegated, status, handleClone, handleDelete, findAllOfficer, handledelegate, handlerejectedAll, handlereqsign }) => {
    if (!id) {
        id = '';
    }
    const [pdfsource, setpdfsource] = useState(null);
    async function getpdf() {
        const res = await axios.get(`${AppConfig.backendURL}/api/template`, {
            headers: { 'reqid': window.location.pathname.split('/')[3] },
            withCredentials: true,
        });
        setpdfsource(res.data.pdfpath);
    }

    const R_draftButton = (requestID: string) => <>
        <Button className="m-1" color="primary" onClick={() => handleClone?.(requestID)} variant="outlined">
            Clone &#x29C9;
        </Button>
        <Link to={`/dashboard/template/${requestID}`}>
            <Button className="m-1" color="pink" variant="outlined">
                Preview &#x1F441;
            </Button>
        </Link>
        <Button className="m-1" color="purple" onClick={() => findAllOfficer?.(requestID)} variant="outlined">
            Send For Signature &#x2714;
        </Button>
        <Button className="m-1" color="danger" onClick={() => handleDelete?.(requestID)} variant="outlined">
            Delete &#x26A0;
        </Button>
    </>

    const R_delegateButton = (requestID: string) => <>
        <Button className="m-1" color="primary" onClick={() => handleClone?.(requestID)} variant="outlined">
            Clone &#x29C9;
        </Button>
        <Button className="m-1" color="purple" onClick={() => { handlereqsign?.(requestID) }} variant="outlined">
            Sign &#x2714;
        </Button>
    </>

    const signedButton = (requestID: string) => <>
        <Button className="m-1" color="primary" onClick={() => handleClone?.(requestID)} variant="outlined">
            Clone &#x29C9;
        </Button>
        <Link to={`/dashboard/template/${requestID}`}>
            {/* <Button className="m-1" color="pink" variant="outlined">
                Print &#x1F441;
            </Button> */}
            <Button className="m-1" color="pink" variant="outlined">
                Preview &#x1F441;
            </Button>
        </Link>
        <Link to={`${AppConfig.backendURL}/upload/${pdfsource}`} download={true}>
            <Button className="m-1" color="purple" onClick={() => { getpdf }} variant="outlined">
                Download &#x2714;
            </Button>
        </Link>
    </>

    const R_pendingButton = (requestID: string) => <>
        <Button className="m-1" color="primary" onClick={() => handleClone?.(requestID)} variant="outlined">
            Clone &#x29C9;
        </Button>
    </>

    const O_pendingButton = (requestID: string) => <>
        <Button className="m-1" color="primary" onClick={() => handleClone?.(requestID)} variant="outlined">
            Clone &#x29C9;
        </Button>
        <Button className="m-1" color="pink" variant="outlined" onClick={() => { handlereqsign?.(requestID) }}>
            Sign &#x1F441;
        </Button>
        <Button className="m-1" color="purple" onClick={() => handledelegate?.(requestID)} variant="outlined">
            Delegate &#x2714;
        </Button>
        <Button className="m-1" color="danger" onClick={() => { handlerejectedAll?.(requestID) }} variant="outlined">
            Reject &#x26A0;
        </Button>
    </>
    switch (status) {
        case "Draft":
            return R_draftButton(id);
        case "Delegated":
            if (role == 3) {
                return R_delegateButton(id);
            }
            else {
                return R_pendingButton(id);
            }
        case "Signed":
        case "Submited":
            return signedButton(id);
        case "Pending":
            if (role === 3) {
                return R_pendingButton(id);
            }
            else {
                return O_pendingButton(id);
            }
        case "Rejected":
            return R_pendingButton(id);
        default:
            return null;
    }
}

export default RequiredButton;