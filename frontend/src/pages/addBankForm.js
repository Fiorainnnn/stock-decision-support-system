import React, { useEffect, useState } from 'react';
import { Card, Button, Divider, Empty, List, Flex, Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import VirtualList from 'rc-virtual-list';
import BankDialog from '../components/bankDialog';
import { BankProfileRequest } from '../api/request/bankProfileRequest.js';
import BankWriteDialog from '../components/bankWriteDialog';
import { useNavigate } from 'react-router-dom'; // 使用 useNavigate 來進行跳轉

const AddBankForm = () => {
    const [banks, setBanks] = useState([]);
    const [isEdit, setIsEdit] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isWriteVisible, setIsWriteVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCheck();
        fetchBankProfiles();
    }, []);

    const fetchCheck = () => {
        BankProfileRequest.checkUploadStatus()
            .then(response => {
                if (response.data.status === "0") {
                    alert("同意書還在審核中，請等待審核通過後再進行操作");
                    navigate('/');
                } else if (response.data.status === "1") {
                } else if (response.data.status === "2") {
                    alert("請簽署同意書才能繼續進行");
                    setIsWriteVisible(true)
                }
            })
            .catch((error) => {
                alert(error.message);
            });
    };

    const fetchBankProfiles = async () => {
        setIsLoading(true);
        try {
            const response = await BankProfileRequest.getBankProfileList();

            if (response && response.data) {
                setBanks(response.data);
            }
        } catch (error) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddClick = () => {
        setIsEdit(false);
        setIsDialogVisible(true);
    };

    const handleModifyClick = (id) => {
        setIsEdit(true);
        BankProfileRequest.getBankProfile(id)
            .then(response => {
                setInitialData(response.data);
            })
            .catch((error) => {
                alert(error.message);
            });
        setIsDialogVisible(true);
    };

    const handleDelete = (id) => {
        BankProfileRequest.deleteBankProfile(id)
            .then(response => {
                alert(response.message);
                fetchBankProfiles();
            })
            .catch((error) => {
                alert(error.message);
            });
    };

    const handleDialogClose = () => {
        setIsDialogVisible(false);
        fetchBankProfiles();
    };

    return (
        <div className="d-flex justify-content-center align-items-center vh-100 w-50">
            <Card
                title={<h1 className='pt-2 mt-1'>銀行資料</h1>}
                extra={<Button type="primary" className="ms-auto button2" onClick={handleAddClick}>新增銀行資料</Button>}
                className='h-75 w-100'
            >
                <Flex gap="middle" vertical>
                    <Spin spinning={isLoading} indicator={<LoadingOutlined spin />} size="large" >
                        {banks.length > 0 ? (
                            <div
                                style={{
                                    height: 'auto',
                                    overflow: 'auto',
                                    padding: '0 16px',
                                }}
                            >
                                <VirtualList
                                    data={banks}
                                    height={'auto'} // 這裡也設定為 auto
                                    itemHeight={47} // 根據你的需求調整
                                    itemKey="id" // 確保這個唯一
                                >
                                    {(bank) => (
                                        <>
                                            <List.Item
                                                key={bank.id}
                                                actions={[]}
                                                style={{ marginBottom: '16px' }} // 增加 item 之間的間距
                                            >
                                                <List.Item.Meta
                                                    title={`銀行名稱: ${bank.bank_name}`}
                                                    description={
                                                        <div className="d-flex justify-content-between align-items-center">
                                                            <div className="d-flex flex-grow-1 gap-3">
                                                                <p className="mb-0">地區: {bank.region}</p>
                                                                <p className="mb-0">分行: {bank.branch}</p>
                                                                <p className="mb-0">帳號末四碼: {bank.account}</p>
                                                            </div>
                                                            <div className="d-flex flex-grow-1 gap-3">
                                                                <Button onClick={() => handleModifyClick(bank.id)}>修改</Button>
                                                                <Button onClick={() => handleDelete(bank.id)}>刪除</Button>
                                                            </div>
                                                        </div>
                                                    }
                                                    className="mt-1"
                                                />
                                            </List.Item>
                                            <Divider className="my-4" />
                                        </>
                                    )}
                                </VirtualList>
                            </div>
                        ) : (
                            <Empty description="沒有銀行資料" />
                        )}
                    </Spin >
                </Flex>
            </Card>
            {isDialogVisible && (
                <BankDialog
                    isEdit={isEdit}
                    initialData={initialData}
                    onClose={handleDialogClose}
                />
            )}
            {isWriteVisible && (
                <BankWriteDialog />
            )}
        </div>
    );
};

export default AddBankForm;
