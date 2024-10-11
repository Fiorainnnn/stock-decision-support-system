import React, { useState } from 'react';
import { Modal, Button, Form, Input, DatePicker, message } from 'antd';
import { BudgetRequest } from '../api/request/budgetRequest.js';

const BudgetDialog = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm(); // 使用 Ant Design 的 Form hook
    const token = localStorage.getItem('token');

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields(); // 清空表單
    };

    const handleFormSubmit = async (values) => {
        // 提交表單前的數據處理
        if (values.start_date) {
            const startDate = new Date(values.start_date);
            values["start_date"] = startDate.toISOString().split('T')[0];  // 格式化為 YYYY-MM-DD
        }

        if (values.end_date) {
            const endDate = new Date(values.end_date);
            values["end_date"] = endDate.toISOString().split('T')[0];  // 格式化為 YYYY-MM-DD
        }

        BudgetRequest.addBudget(values)
            .then(response => {
                message.success(response.message);
                setIsModalVisible(false); // 正確關閉模態框
                form.resetFields(); // 提交後清空表單
                window.location.reload();
            })
            .catch((error) => {
                message.error(error.message);
            });
    };

    return (
        <>
            {token && (
                <Button
                    type="primary"
                    shape="circle"
                    className="button1"
                    onClick={showModal}
                    style={{
                        position: 'fixed',
                        right: '1rem',
                        bottom: '6rem',
                        width: '60px',
                        height: '60px',
                        fontSize: '24px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000, // 確保按鈕浮動在上層
                    }}
                >
                    +
                </Button>
            )}
            <Modal
                title="新增目標"
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleFormSubmit}
                >
                    <Form.Item
                        name="name"
                        label="目標"
                        rules={[{ required: true, message: '請輸入目標名稱！' }]}
                    >
                        <Input placeholder="目標" />
                    </Form.Item>
                    <Form.Item
                        name="start_date"
                        label="起始日"
                        rules={[{ required: true, message: '請選擇起始日' }]}
                    >
                        <DatePicker format="YYYY-MM-DD" onChange={(date) => form.setFieldsValue({ 'start_date': date })} />
                    </Form.Item>

                    <Form.Item
                        name="end_date"
                        label="結束日"
                        rules={[{ required: true, message: '請選擇結束日' }]}
                    >
                        <DatePicker format="YYYY-MM-DD" onChange={(date) => form.setFieldsValue({ 'end_date': date })} />
                    </Form.Item>

                    <Form.Item
                        name="target"
                        label="目標金額"
                        rules={[{ required: true, message: '請輸入目標金額' }]}
                    >
                        <Input type="number" placeholder="輸入目標金額" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            提交
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default BudgetDialog;
