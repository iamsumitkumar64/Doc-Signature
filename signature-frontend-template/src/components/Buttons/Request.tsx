import { Button } from "antd";
import React from "react";
import { Link } from "react-router";

interface ButtonInterfaceProps {
    id: string | null;
    role?: number;
    status?: 'Draft' | 'Signed' | 'Pending' | 'Rejected' | 'Delegated';
    handlereject?: (requestID: string) => Promise<void>;
    handlesign?: (requestID: string) => Promise<void>;
}
const RequiredButton: React.FC<ButtonInterfaceProps> = ({ id, role, status, handlereject, handlesign }) => {
    if (!id) {
        id = '';
    }
    const R_Wait = () => <>
        <Link to={`/dashboard/requests`}>
            <Button className="m-1" color="blue" variant="outlined">
                Send Main Request To officer
            </Button>
        </Link>
    </>

    const R_pendingButton = (requestID: string) => <>
        <p>{status} Status</p>
        <Link to={`/dashboard/template/${requestID}`}>
            <Button className="m-1" color="pink" variant="outlined">
                Preview &#x1F441;
            </Button>
        </Link>
    </>

    const O_pendingButton = (requestID: string) => <>
        <Button className="m-1" color="pink" onClick={() => { handlesign?.(requestID) }} variant="outlined">
            Sign &#x1F441;
        </Button>
        <Button className="m-1" color="danger" onClick={() => { handlereject?.(requestID) }} variant="outlined">
            Reject &#x26A0;
        </Button>
    </>
    switch (status) {
        case "Signed":
            return R_pendingButton(id);
        case "Draft":
            return R_Wait();
        case "Pending":
            if (role === 3) {
                return R_pendingButton(id);
            }
            else {
                return O_pendingButton(id);
            }
        case 'Delegated':
            if (role === 3) {
                return O_pendingButton(id);
            }
        case "Rejected":
            return R_pendingButton(id);
        default:
            return null;
    }
}

export default RequiredButton;