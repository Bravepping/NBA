import request from "./request";
import axios from 'axios'
const nbaapi = axios.create({
  baseURL: 'http://localhost:9005/api',
  // baseURL: 'http://110.42.255.182:8080',
  timeout: 2000,
})

const urls = async () => {
  return await nbaapi({
    url: '/urls',
    method: 'get',
  })
    .then((response) => {
      // console.log(response.data); // 可选：调试用
      return response.data; // 返回数据
    })
    .catch((error) => {
      console.error('获取直播URL失败:', error);
      throw error; // 可以选择抛出错误或返回默认值，比如 return []
    });
};

const games = () => {
     nbaapi({
        url: '/games',
        method: 'get',
    }).then((response) => {
        console.log(response.data);
    })
  }
  const schedule =(params) => {
    return request({
        url: '/game/schedule',
        method: 'get',
        params: params,
    });
  }

  export {schedule,games,urls};