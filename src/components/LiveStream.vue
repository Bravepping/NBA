<template>
  <div class="live-stream-container">
    <!-- 比赛信息 -->
    <div class="game-header" v-if="gameData">
      <div class="team-info away-team">
        <img :src="gameData.awayTeam.logo" :alt="gameData.awayTeam.name" />
        <div class="team-details">
          <!-- <h3>{{ gameData.awayTeam.city }}</h3> -->
          <p>{{ gameData.awayTeam.name }}</p>
          <span>{{ gameData.awayTeam.record }}</span>
        </div>
      </div>

      <div class="vs-circle">VS</div>

      <div class="team-info home-team">

        <div class="team-details">
          <!-- <h3>{{ gameData.homeTeam.city }}</h3> -->
          <p>{{ gameData.homeTeam.name }}</p>
          <span>{{ gameData.homeTeam.record }}</span>
        </div>
        <img :src="gameData.homeTeam.logo" :alt="gameData.homeTeam.name" />
      </div>
    </div>

    <!-- 播放器 -->
    <div id="dplayer-live" class="dplayer-container"></div>

    <!-- 直播源列表（始终显示） -->
    <div class="stream-switcher" v-if="allStreams.length > 0">
      <!-- <h3>直播源</h3> -->
      <div class="stream-buttons">
        <button
          v-for="stream in allStreams"
          :key="stream.type"
          @click="switchStream(stream)"
          :class="{ active: currentStream?.type === stream.type }"
        >
          {{ getStreamName(stream.type) }}
        </button>
      </div>
    </div>

    <!-- 返回按钮 -->
    <button class="back-button" @click="goBack">← 返回赛程</button>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRouter } from "vue-router";
import { useGameStore } from "@/stores/game";
import DPlayer from "dplayer";
import Hls from "hls.js";
import Flv from "flv.js";

// 注册全局变量
window.flvjs = Flv;
window.Hls = Hls;

const router = useRouter();
const gameStore = useGameStore();

const dpInstance = ref(null);

// 从store获取数据
const gameData = computed(() => gameStore.currentGame);
const allStreams = computed(() => gameStore.allStreams);
const currentStream = computed({
  get: () => gameStore.currentStream,
  set: (val) => (gameStore.currentStream = val),
});

// 初始化播放器
// const initPlayer = () => {
//   if (dpInstance.value) {
//     dpInstance.value.destroy();
//   }

//   dpInstance.value = new DPlayer({
//     container: document.getElementById('dplayer-live'),
//     live: true,
//     autoplay: true,
//     video: {
//       url: currentStream.value?.url || '',
//       type: 'auto'
//     }
//   });

//   // 强制设置视频尺寸
//   setTimeout(() => {
//     const container = document.getElementById('dplayer-live');
//     const video = container?.querySelector('video');
//     if (video) {
//       video.style.cssText = `
//         width: 100% !important;
//         height: 100% !important;
//         object-fit: contain !important;
//         position: absolute !important;
//         top: 0 !important;
//         left: 0 !important;
//       `;
//       // console.log('视频实际尺寸:', video.videoWidth, 'x', video.videoHeight);
//     }
//   }, 500);
// };
// 改进的播放器初始化（核心修改点）
// 改进的播放器初始化（核心修改点）
const initPlayer = () => {
  if (!currentStream.value?.url) return;

  // 销毁旧实例
  if (dpInstance.value) {
    dpInstance.value.destroy();
  }

  dpInstance.value = new DPlayer({
    container: document.getElementById("dplayer-live"),
    live: true,
    autoplay: true,
    airplay: true,
    video: {
      url: currentStream.value.url,
      type: "custom", // 修改为custom类型
      customType: {
        custom: function (video, player) {
          const url = video.src;

          // 自动检测协议类型
          if (url.includes(".m3u8") || url.endsWith("/hls")) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(video);
            player.on("destroy", () => hls.destroy());
          } else if (url.includes(".flv") || url.endsWith("/flv")) {
            const flv = Flv.createPlayer({ type: "flv", url });
            flv.attachMediaElement(video);
            flv.load();
            player.on("destroy", () => flv.destroy());
          } else {
            // 其他协议回退到DPlayer默认处理
            video.src = url;
          }
        },
      },
    },
  });

  // 保持原有尺寸调整逻辑
  setTimeout(() => {
    const video = document
      .getElementById("dplayer-live")
      ?.querySelector("video");
    if (video) {
      video.style.cssText = `
        width: 100% !important;
        height: 100% !important;
        object-fit: contain !important;
      `;
    }
  }, 500);
};

// 切换直播源
const switchStream = (stream) => {
  currentStream.value = stream;
  initPlayer();
};

// 获取直播源名称
const getStreamName = (type) => {
  const names = {
    tx: "企鹅体育",
    wl: "纬来体育",
    mg: "咪咕体育",
    nba: "高清原声",
    zb: "高清直播",
  };
  return names[type] || type;
};

// 返回赛程页
const goBack = () => {
  gameStore.clearGameData();
  router.go(-1);
};

onMounted(() => {
  // 默认选择第一个直播源
  if (allStreams.value.length > 0 && !currentStream.value) {
    currentStream.value = allStreams.value[0];
  }
  initPlayer();
});

onBeforeUnmount(() => {
  if (dpInstance.value) {
    dpInstance.value.destroy();
  }
});
</script>

<style lang="scss" scoped>
.live-stream-container {
  max-width: 1200px;
  margin: 0 auto;
  // padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
}

.game-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin-bottom: 20px;
  margin-top: 20px;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.team-info {
  display: flex;
  align-items: center;
  gap: 15px;

  img {
    width: 80px;
    height: 80px;
    object-fit: contain;
  }

  .team-details {
    text-align: center;

    h3 {
      margin: 0;
      font-size: 1.2rem;
      color: #333;
    }

    p {
      margin: 5px 0;
      font-size: 1.1rem;
      font-weight: bold;
    }

    span {
      font-size: 0.9rem;
      color: #666;
    }
  }
}

.vs-circle {
  width: 50px;
  height: 50px;
  background: #f29155;
  color: white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.2rem;
  font-weight: bold;
}

.dplayer-container {
  width: 100%;
  aspect-ratio: 16/9;
  position: relative;
  background: #000;

  ::v-deep {
    .dplayer-video {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain !important;
    }
  }
}

.stream-switcher {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 20px;
}

.stream-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;

  button {
    padding: 8px 16px;
    background: #f0f0f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #e0e0e0;
    }

    &.active {
      background: #3498db;
      color: white;
    }
  }
}

.back-button {
  display: block;
  width: 200px;
  margin: 30px auto 0;
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  text-align: center;

  &:hover {
    background: #2980b9;
  }
}

@media (max-width: 768px) {
  .game-header {
    // flex-direction: column;
    gap: 20px;
    .team-info {
      display: flex;
      align-items: center;
      gap: 15px;

      img {
        width: 60px;
        height: 60px;
        object-fit: contain;
      }

      .team-details {
        text-align: center;

        h3 {
          margin: 0;
          font-size: 1.2rem;
          color: #333;
        }

        p {
          margin: 5px 0;
          font-size: 1.1rem;
          font-weight: bold;
        }

        span {
          font-size: 0.9rem;
          color: #666;
        }
      }
    }
  }

  .vs-circle {
    margin: 10px 0;
  }

  .back-button {
    width: 100%;
  }
}
</style>
