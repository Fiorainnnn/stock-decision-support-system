import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, Checkbox, Form } from 'antd';
import accountIcon from '../assets/images/account.png';
import padlockIcon from '../assets/images/padlock.png';
import '../assets/css/login.css';
import { useUser } from '../userContext';
import axios from 'axios';
import { config } from "../config";  

const BASE_URL = config.API_URL;

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setUser, user } = useUser(); // 獲取 setUser 函數
  const { login } = useUser();  // 使用 Context 中的 login 函數

  useEffect(() => {
    const is_login = localStorage.getItem('is_login');
    if (is_login) {
      alert('帳號已登入，請登出後再試一次')
      navigate('/#', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (values) => {
    // 確保所有input都已填寫
    if (!values.username || !values.password) {
      alert('請填寫所有欄位');
      return;
    }

    if (window.grecaptcha) {
      window.grecaptcha.ready(async () => {
        const token = await window.grecaptcha.execute('6LdmwcgpAAAAAChdggC5Z37c_r09EmUk1stanjTj', { action: 'login' });
        document.getElementById('recaptchaToken').value = token;

        // 準備要發送的數據，包括 reCAPTCHA token
        const loginData = {
          username: values.username,
          password: values.password,
          'g-recaptcha-response': token  // 將 token 添加到發送的數據中
        };
        

        try {
          const response = await axios.post(`${BASE_URL}/login/`, loginData, {
            headers: { 'Content-Type': 'application/json' }
          });

          if (response.data.status === 'success') {
            const { token, is_superuser, is_staff, is_active } = response.data;
            if (!is_active){
              alert('帳號已被停用')
            }
            else{
            login(values.username);
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('is_superuser', is_superuser);
            localStorage.setItem('is_staff', is_staff);
            setUser({ username: values.username, is_superuser, is_staff });
            alert('登入成功');
            navigate('/#');
          }
          } else {
            alert('帳號或密碼錯誤，請再試一次');
          }
        } catch (error) {
          console.error('登入失敗:', error);
          alert('登入請求出錯');
        }
      });
    }
};

  return (
    <div className="kv w-100">
      <div className="User">
        <div className="container-fluid">
          <div className="row justify-content-center align-items-center h-100 pt-5">
            <div className="col-md-4" style={{ backgroundColor: 'rgba(232, 180, 188, 0.65)' }}>
              <h2 className="fw-bold d-flex justify-content-center pt-4">登入</h2>
              <h4 className="d-flex justify-content-center mb-4" style={{ fontSize: '16px' }}>
                歡迎來到智投金紡
              </h4>
              <input type="hidden" id="recaptchaToken" name="g-recaptcha-response" />
              <Form className="px-5" onFinish={handleSubmit}>
                {/* 用戶名輸入 */}
                <Form.Item
                  name="username"
                  rules={[{ required: true, message: '請輸入用戶名' }]}
                >
                  <Input
                    prefix={<img alt="" className="img-fluid" src={accountIcon} style={{ width: '20px' }} />}
                    placeholder="帳號"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </Form.Item>
                {/* 密碼輸入 */}
                <Form.Item
                  name="password"
                  rules={[{ required: true, message: '請輸入密碼' }]}
                >
                  <Input.Password
                    prefix={<img alt="" className="img-fluid" src={padlockIcon} style={{ width: '20px' }} />}
                    placeholder="密碼"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Form.Item>

                <Form.Item>
                  <div className="text-end d-flex">
                    <Checkbox className="me-2"></Checkbox><span className="w-50 d-flex align-items-center"  style={{fontSize:'18px' ,color:'#BD4C7F'}}>記住帳號</span>
                    <div className="w-50 d-flex justify-content-end">
                      <a className="linka align-items-center" style={{ fontSize: '18px' }} href="./forgotPassword">
                        忘記密碼
                      </a>
                    </div>
                  </div>
                </Form.Item>

                {/* 提交按鈕 */}
                <Form.Item>
                  <Button type="primary" htmlType="submit" className="w-100 fw-bolder button2" 
                  style={{
                    background: 'linear-gradient(to right, #BD4C7F, #d38a95)',
                    borderColor: 'initial', // 重設邊框色
                  }}>
                    登入
                  </Button>
                </Form.Item>
                {/* 其他鏈接 */}
                <div className="text-center mb-4">
                  <span>沒有帳號?立即<a href="./signUp">免費申請！</a></span>
                </div>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
