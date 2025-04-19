<template>
    <div class="player-container">
      <!-- 播放器容器 -->
      <div id="dplayer" ref="dplayerRef"></div>
      
      <!-- 浏览器不支持提示 -->
      <div v-if="!isSupported" class="unsupported-tip">
        当前浏览器不支持HLS直播流播放，请使用Chrome/Firefox/Edge等现代浏览器
      </div>
      
      <!-- 移动端自动播放提示 -->
      <div v-if="showPlayButton" class="play-button" @click="handleClickPlay">
        <span class="icon">▶</span>
        <span>点击播放</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue'
  import DPlayer from 'dplayer'
  import Hls from 'hls.js'
//   import 'dplayer/dist/DPlayer.min.css'
  
  const dplayerRef = ref(null)
  const dp = ref(null)
  const isSupported = ref(true)
  const showPlayButton = ref(false)
  
  // 初始化播放器
  const initPlayer = () => {
    // 销毁旧实例
    if (dp.value) {
      dp.value.destroy()
    }
  
    const options = {
      container: dplayerRef.value,
      live: true,
      autoplay: !isMobile(), // 非移动端自动播放
      video: {
        url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', // 替换为实际m3u8地址
        type: 'customHls',
        customType: {
          customHls: (video, player) => {
            const hls = new Hls({
              enableWorker: true, // 启用HLS.js的Web Worker
              maxBufferLength: 30, // 最大缓冲长度(秒)
              maxMaxBufferLength: 600, // 最大缓冲限制
              maxBufferSize: 60 * 1000 * 1000, // 最大缓冲大小(bytes)
              maxBufferHole: 0.5 // 最大允许的缓冲缺口(秒)
            })
            
            hls.loadSource(video.src)
            hls.attachMedia(video)
            
            // 错误处理
            hls.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    console.error('网络错误，尝试重新加载')
                    hls.startLoad()
                    break
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    console.error('媒体错误，尝试恢复')
                    hls.recoverMediaError()
                    break
                  default:
                    initPlayer() // 其他错误重新初始化
                }
              }
            })
            
            player.on('destroy', () => hls.destroy())
          }
        }
      }
    }
  
    // 如果是Safari且支持原生HLS
    if (isSafari() && video.canPlayType('application/vnd.apple.mpegurl')) {
      options.video.type = 'hls'
      delete options.video.customType
    }
  
    dp.value = new DPlayer(options)
    
    // 移动端需要用户交互后才能播放
    if (isMobile()) {
      showPlayButton.value = true
      dp.value.pause()
    }
  }
  
  // 检测移动端
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
  
  // 检测Safari浏览器
  const isSafari = () => {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  }
  
  // 点击播放按钮
  const handleClickPlay = () => {
    dp.value.play()
    showPlayButton.value = false
  }
  
  onMounted(() => {
    // 检查浏览器支持情况
    if (!Hls.isSupported() && !video.canPlayType('application/vnd.apple.mpegurl')) {
      isSupported.value = false
      return
    }
    
    initPlayer()
  })
  
  onBeforeUnmount(() => {
    if (dp.value) {
      dp.value.destroy()
    }
  })
  </script>
  
  <style lang="scss" scoped>
  .player-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    background-color: #000;
  
    #dplayer {
      width: 100%;
      height: 0;
      padding-bottom: 56.25%; /* 16:9 比例 */
      position: relative;
      overflow: hidden;
  
      /* 确保 DPlayer 内部视频元素正确填充 */
      & > div {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
      }
  
      /* 强制视频填充整个播放器 */
      video {
        width: 100%;
        height: 100%;
        object-fit: contain; /* 或使用 'cover' 填充整个容器（可能裁剪边缘） */
      }
    }
  }
  </style>