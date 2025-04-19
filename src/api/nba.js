import request from "./request";
import axios from 'axios'

const nbaapi = axios.create({
  baseURL: 'http://api.new9.me/api',
  // baseURL: 'http://110.42.255.182:8080',
  timeout: 2000,
})

const urls = async () => {
  return await nbaapi({
    url: '/urls',
    method: 'get',
  })
  .then((response) => {
    return response.data;
  })
  .catch((error) => {
    console.error('获取直播URL失败:', error);
    throw error;
  });
};

const games = async () => {
  return await nbaapi({
    url: '/games',
    method: 'get',
  })
  .then((response) => {
    // console.log(response.data); // 调试用
    return response.data; // 确保返回数据
  })
  .catch((error) => {
    console.error('获取赛事数据失败:', error);
    throw error; // 或者返回空数组 return []
  });
};

const go = async (pwd) => {
  return await nbaapi({
    url: '/go',
    method: 'get',
    params: {
      // 这里可以添加请求参数
      pwd: pwd,
    },
  })
  .then((response) => {
    // console.log(response.data); // 调试用
    return response.data; // 确保返回数据
  })
  .catch((error) => {
    console.error('获取赛事数据失败:', error);
    throw error; // 或者返回空数组 return []
  });
};

const schedule = (params) => {
  return request({
    url: '/game/schedule',
    method: 'get',
    params: params,
  });
};

const addUrls = async (gameId, urls) => {
  return await nbaapi({
    url: '/addUrls',
    method: 'post',
    data: {
      gameId: gameId,
      urls: urls
    }
  })
  .then((response) => {
    return response.data;
  })
  .catch((error) => {
    console.error('添加直播URL失败:', error);
    throw error;
  });
};

export { schedule, games, urls, go,addUrls };