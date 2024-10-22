import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Modal, Form, Select, Input, Popover, notification } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import '../assets/css/investmentList.css';
import { InvestmentRequest } from '../api/request/investmentRequest.js';

const { Option } = Select;
const { confirm } = Modal;

const InvestmentList = () => {
  const navigate = useNavigate();
  const [investmentData, setInvestmentData] = useState([]);  // 用來存儲投資組合
  const [isModalVisible, setIsModalVisible] = useState(false);  // 控制模態框顯示
  const [editingPortfolioId, setEditingPortfolioId] = useState(null);  // 用於追踪是否正在編輯
  const [form] = Form.useForm();
  const [selectedStocks, setSelectedStocks] = useState([]);  // 用於儲存選擇的股票
  const [stockOptions, setStockOptions] = useState([]);  // 用於儲存股票選項
  const [stockPrices, setStockPrices] = useState({}); // 儲存每個股票的價格

  // 獲取股票選項
  useEffect(() => {
    InvestmentRequest.getAllStocks()
      .then(response => {
        setStockOptions(response.data);  // 成功後設置股票選項
      })
      .catch(error => {
        console.error('無法獲取股票列表:', error);
      });
  }, []);

  // 獲取用戶的投資組合資料
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      InvestmentRequest.getPortfolios()
        .then(response => {
          const portfolios = response.data.map(item => ({ ...item, key: item.id }));
          portfolios.forEach(portfolio => {
            portfolio.investments.forEach(stock => {
              fetchStockPrice(stock.symbol);  // 自動查詢每個股票的價格和名稱
            });
          });
          setInvestmentData(portfolios);  // 更新投資組合數據
        })
        .catch(error => {
          console.error('無法獲取投資組合:', error);
        });
    } else {
      console.error('Token not found.');
    }
  }, []);

  // 控制模態框顯示
  const showModal = () => {
    setIsModalVisible(true);  // 打開模態框
  };

  // 查詢股票即時價格或收盤價
  const fetchStockPrice = (symbol) => {
    if (!stockPrices[symbol]) {  // 如果價格還未查詢過，才發送請求
      InvestmentRequest.getStockPrice(symbol)
        .then(response => {
          setStockPrices(prevPrices => ({
            ...prevPrices,
            [symbol]: {
              price: response.data.price,  // 儲存股票價格
              name: response.data.name     // 儲存股票名稱
            },
          }));
        })
        .catch(error => {
          console.error(`無法獲取股票 ${symbol} 的價格:`, error);
        });
    }
  };

  // 提交表單時處理的邏輯
  const handleOk = () => {
    form.validateFields()
      .then(values => {
        const newPortfolio = {
          name: values.portfolioName,
          description: values.description,
          investments: selectedStocks.map(stockSymbol => ({
            symbol: stockSymbol,
            shares: values[`quantity_${stockSymbol}`],
            buy_price: values[`investment_cost_${stockSymbol}`], // 使用投資成本作為 buy_price
          }))
        };

        const token = localStorage.getItem('token');
        if (token) {
          if (editingPortfolioId) {
            // 編輯狀態，更新投資組合
            InvestmentRequest.updatePortfolio(editingPortfolioId, newPortfolio)
              .then(response => {
                const updatedData = investmentData.map(item =>
                  item.id === editingPortfolioId ? { ...response.data, key: response.data.id } : item
                );
                setInvestmentData(updatedData);
                setIsModalVisible(false);
                form.resetFields();
                setEditingPortfolioId(null);  // 清空編輯狀態

                // 顯示成功通知
                notification.success({
                  message: '更新成功',
                  description: '投資組合更新成功',
                });

                // 重整頁面
                window.location.reload(); // 刷新頁面
              })
              .catch(error => {
                console.error('更新投資組合失敗:', error.response?.data || error.message);
                notification.error({
                  message: '更新失敗',
                  description: '投資組合更新失敗，請重試。',
                });
              });
          }
        } else {
          console.error('Token not found');
        }
      })
      .catch(info => {
        console.log('驗證失敗:', info);
      });
  };

  // 刪除投資組合時彈出確認對話框
  const showDeleteConfirm = (id, name) => {
    confirm({
      title: `確定刪除 ${name} 嗎?`,
      content: '這個操作無法撤銷。',
      okText: '是',
      okType: 'danger',
      cancelText: '否',
      onOk() {
        handleDelete(id);
      },
      onCancel() {
        console.log('取消刪除');
      },
    });
  };

  // 刪除投資組合
  const handleDelete = (id) => {
    const token = localStorage.getItem('token');
    if (token) {
      InvestmentRequest.deletePortfolio(id)
        .then(() => {
          setInvestmentData(investmentData.filter(item => item.id !== id));
          notification.success({
            message: '刪除成功',
            description: '投資組合已成功刪除',
          });
        })
        .catch(error => {
          console.error('刪除投資組合失敗:', error);
          notification.error({
            message: '刪除失敗',
            description: '刪除投資組合失敗，請重試。',
          });
        });
    } else {
      console.error('Token not found');
    }
  };

  // 編輯投資組合
  const handleEdit = (record) => {
    // 設置投資組合的現有股票到表單中
    const stockFields = {};
    record.investments.forEach(stock => {
      stockFields[`quantity_${stock.symbol}`] = stock.shares;
      stockFields[`investment_cost_${stock.symbol}`] = stock.buy_price;  // 將 buy_price 顯示為投資成本
    });

    form.setFieldsValue({
      portfolioName: record.name,
      description: record.description,
      stocks: record.investments.map(stock => stock.symbol),
      ...stockFields,  // 將股票數據設置到表單中
    });

    setSelectedStocks(record.investments.map(stock => stock.symbol));  // 設置選中的股票
    setEditingPortfolioId(record.id);  // 設置為編輯模式
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingPortfolioId(null);  // 清空編輯狀態
  };

  // 處理投資成本變化
  const handleInvestmentCostChange = (stockSymbol, investmentCost) => {
    const quantity = form.getFieldValue(`quantity_${stockSymbol}`);
    if (quantity > 0) {
      const pricePerShare = investmentCost / quantity;
      form.setFieldsValue({
        [`price_${stockSymbol}`]: pricePerShare.toFixed(2),
      });
    }
  };

  const handleStocksChange = (value) => {
    setSelectedStocks(value);
  };

  const columns = [
    {
      title: '投資組合名稱',
      dataIndex: 'name',
      key: 'name',
      render: text => <strong>{text}</strong>,
    },
    {
      title: '總成本 (NT$)',
      dataIndex: 'marketValue',
      key: 'totalCost',
      render: (text, record) => {
        const portfolioStocks = Array.isArray(record.investments) ? record.investments : [];

        // 計算總成本
        const totalCost = portfolioStocks.reduce((acc, stock) => {
          const stockCost = stock.shares * stock.buy_price;
          return acc + stockCost;
        }, 0);

        return `NT$ ${totalCost.toLocaleString()}`;
      },
    },
    {
      title: '總市值 (NT$)',
      dataIndex: 'marketValue',
      key: 'marketValue',
      render: (text, record) => {
        const portfolioStocks = Array.isArray(record.investments) ? record.investments : [];

        // 計算總市值
        const totalMarketValue = portfolioStocks.reduce((acc, stock) => {
          const stockInfo = stockPrices[stock.symbol] || {};
          const stockPrice = stockInfo.price || 0;
          const stockMarketValue = stock.shares * stockPrice;
          return acc + stockMarketValue;
        }, 0);

        const stockDetails = portfolioStocks.map(stock => {
          const stockInfo = stockPrices[stock.symbol] || {};
          const stockPrice = stockInfo.price || 0;
          const stockName = stockInfo.name || "未知股票名稱";
          const marketValue = stock.shares * stockPrice;

          return (
            <div key={stock.symbol} style={{ marginBottom: '10px' }}>
              <div><strong>股票名稱:</strong> {stock.symbol} {stockName}</div>
              <div><strong>股數:</strong> {stock.shares} 股</div>
              <div><strong>個股價值:</strong> NT$ {stockPrice.toLocaleString()} / 股</div>
              <div><strong>市值:</strong> NT$ {marketValue.toLocaleString()}</div>
            </div>
          );
        });

        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div>NT$ {totalMarketValue.toLocaleString()}</div>
            <Popover
              content={(
                <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {stockDetails}
                </div>
              )}
              title={`${record.name} 的股票清單`}
              trigger="click"
            >
              <InfoCircleOutlined style={{ marginLeft: 8, cursor: 'pointer', color: '#1890ff' }} />
            </Popover>
          </div>
        );
      },
    },
    {
      title: '總回報率 (%)',
      dataIndex: 'performance',
      key: 'performance',
      render: (text, record) => {
        const portfolioStocks = Array.isArray(record.investments) ? record.investments : [];

        // 計算總市值
        const totalMarketValue = portfolioStocks.reduce((acc, stock) => {
          const stockInfo = stockPrices[stock.symbol] || {};
          const stockPrice = stockInfo.price || 0;
          const stockMarketValue = stock.shares * stockPrice;
          return acc + stockMarketValue;
        }, 0);

        // 計算總成本
        const totalCost = portfolioStocks.reduce((acc, stock) => {
          const stockCost = stock.shares * stock.buy_price;
          return acc + stockCost;
        }, 0);

        // 計算總回報率
        const totalReturnRate = totalCost > 0 ? ((totalMarketValue - totalCost) / totalCost) * 100 : 0;

        return (
          <span style={{ color: totalReturnRate >= 0 ? 'red' : 'green' }}>
            {totalReturnRate.toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (text, record) => (
        <span>
          <Button type="link" onClick={() => handleEdit(record)}>編輯</Button>
          <Button type="link" danger onClick={() => showDeleteConfirm(record.id, record.name)}>刪除</Button>
        </span>
      ),
    }
  ];

  return (
    <div className='container'>
      <h1 className="title">投資組合總覽</h1>
      <Button type="primary" className="ms-auto button2" onClick={showModal} style={{ marginBottom: 16 }}>
        新增投資組合
      </Button>
      <Table
        columns={columns}
        dataSource={investmentData}
        pagination={false}
        bordered
        scroll={{ y: 400 }}
        rowClassName={(record) => record.performance >= 0 ? 'positive-row' : 'negative-row'}
      />

      <Modal
        title={editingPortfolioId ? "編輯投資組合" : "新增投資組合"}
        open={isModalVisible}  // 控制模態框顯示
        onOk={handleOk}
        onCancel={handleCancel}
        okText="確認"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="portfolioName" label="投資組合名稱" rules={[{ required: true, message: '請輸入投資組合名稱' }]}>
            <Input placeholder="請輸入投資組合名稱" />
          </Form.Item>

          <Form.Item name="description" label="投資組合描述" rules={[{ required: true, message: '請輸入投資組合描述' }]}>
            <Input placeholder="請輸入投資組合描述" />
          </Form.Item>

          <Form.Item name="stocks" label="選擇股票" rules={[{ required: true, message: '請選擇至少一支股票' }]}>
            <Select mode="multiple" placeholder="選擇股票" onChange={handleStocksChange} style={{ width: '100%' }}>
              {stockOptions.map(stock => (
                <Option key={stock.symbol} value={stock.symbol}>
                  {stock.name} ({stock.symbol})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedStocks.map(stockSymbol => (
            <div key={stockSymbol}>
              <Form.Item name={`quantity_${stockSymbol}`} label={`股數 (${stockSymbol})`} rules={[{ required: true, message: `請輸入 ${stockSymbol} 的股數` }]}>
                <Input placeholder={`請輸入 ${stockSymbol} 的股數`} type="number" />
              </Form.Item>
              <Form.Item
                name={`investment_cost_${stockSymbol}`}
                label={`投資成本 (${stockSymbol})`}
                rules={[{ required: true, message: `請輸入 ${stockSymbol} 的投資成本` }]}
              >
                <Input
                  placeholder={`請輸入 ${stockSymbol} 的投資成本`}
                  type="number"
                  onChange={e => handleInvestmentCostChange(stockSymbol, e.target.value)}
                />
              </Form.Item>
              <Button type="link" danger onClick={() => handleDelete(stockSymbol)}>刪除股票</Button>
            </div>
          ))}
        </Form>
      </Modal>
    </div>
  );
};

export default InvestmentList;
