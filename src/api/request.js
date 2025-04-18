import axios from 'axios'



const request = axios.create({
  baseURL: 'https://api.nba.cn/sib/v2',
  // baseURL: 'http://110.42.255.182:8080',
  timeout: 2000,
})

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => Promise.reject(error), // 请求错误处理
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data
    }
    return Promise.reject(response)
  },
  (error) => {
    return Promise.reject(error)
  },
)

export default request
