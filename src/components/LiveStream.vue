<template>
  <div class="video-container">
    <div 
      v-for="(video, index) in videoList" 
      :key="index" 
      class="video-card"
      @click="handleCardClick(index)"
    >
      <div class="video-wrapper">
        <div :id="'dplayer-' + index" class="dplayer-container"></div>
      </div>
      <div class="video-info">
        <h3 class="video-title">{{ video.title }}</h3>
        <p class="video-desc">{{ video.description }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import DPlayer from 'dplayer'
import Hls from 'hls.js'
import Flv from 'flv.js'
// 将 flv.js 注册为全局变量
window.flvjs = Flv
window.Hls = Hls
// 视频列表数据
const videoList = ref([
  {
    title: '示例视频1',
    description: '这是一个示例视频描述',
    // url: './../../public/videos/7.mp4',
    url: 'https://feijing-xzbonlinepull.bszb.me/live/202_3520771_1.m3u8?txSecret=92b9a5df1d71b2a1dbf4cb41e7c7b507&txTime=68011a9d',
    // pic: 'https://example.com/poster1.jpg'
  },
  // {
  //   title: '示例视频2',
  //   description: '这是另一个示例视频描述',
  //   url: 'https://example.com/video2.mp4',
  //   pic: 'https://example.com/poster2.jpg'
  // },
  // 可以添加更多视频
])

const dpInstances = ref([])

// 初始化播放器
const initDPlayers = () => {
  videoList.value.forEach((video, index) => {
    const dp = new DPlayer({
      container: document.getElementById(`dplayer-${index}`),
      // live: true,
      screenshot: true,
      autoplay: true,
      theme: '#b7daff',
      loop: false,
      lang: 'zh-cn',
      hotkey: true,
      preload: 'auto',
      volume: 0.6,
      video: {
        url: video.url,
        pic: video.pic,
        thumbnails: video.pic,
        type: 'auto',
      },
      pluginOptions:{
        hls: {
          // 这里可以添加 HLS.js 的配置选项
          debug: true,
          enableWorker: true,
          manifestLoadingTimeOut: 10000,
          levelLoadingTimeOut: 10000,
        },
        flv: {
          // 这里可以添加 FLV.js 的配置选项
          enableWorker: true,
          enableStashBuffer: true,
          stashInitialSize: 128,
        }
      }
    })
    console.log(dp.plugins.flv); // flv 实例
    // 监听播放器的事件
    dpInstances.value.push(dp)

  })
}


// 处理卡片点击事件
const handleCardClick = (index) => {
  // 暂停所有其他播放器
  dpInstances.value.forEach((dp, i) => {
    if (i !== index && !dp.video.paused) {
      dp.pause()
    }
  })
}

onMounted(() => {
  initDPlayers()
})

onBeforeUnmount(() => {
  // 销毁所有播放器实例
  dpInstances.value.forEach(dp => {
    dp.destroy()
  })
})
</script>

<style lang="scss" scoped>
.video-container {
  display: flex;
  flex-wrap: wrap;
  padding: 40px 0;
  justify-content: center;
  // align-items: center;

  .video-card {
    flex: 1 1 calc(33.333% - 20px);
    min-width: 768px;
    max-width: 70%;
    background: #d6f3f0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    cursor: pointer;

    &:hover {
      // transform: translateY(-5px);
      box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    }

    .video-wrapper {
      position: relative;
      padding-top: 56.25%; /* 16:9 宽高比 */
      overflow: hidden;

      .dplayer-container {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
    }

    .video-info {
      padding: 15px;

      .video-title {
        margin: 0 0 8px 0;
        font-size: 1.1rem;
        color: #333;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .video-desc {
        margin: 0;
        font-size: 0.9rem;
        color: #666;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .video-container {
    .video-card {
      flex: 1 1 calc(50% - 15px);
      min-width: 100%;
    }
  }
}

@media (max-width: 480px) {
  .video-container {

    .video-card {
      flex: 1 1 100%;
      min-width: 100%;
    }
  }
}
</style>