<template>
  <div class="nba-schedule-container">
    <!-- 赞助商信息 -->
    <div v-if="scheduleData?.data?.sponsor" class="sponsor-banner">
      <span>所有内容均来源互联网，有问题请联系邮箱：xdd9@vip.qq.com</span>
      <!-- <img
        :src="scheduleData.data.sponsor.logo"
        :alt="scheduleData.data.sponsor.name"
        class="sponsor-logo"
      /> -->
    </div>

    <!-- 赛程日期导航 -->
    <div class="date-navigation">
      <button
        @click="changeDate('pre')"
        class="nav-button"
        :disabled="!scheduleData?.data?.preDate"
      >
        <span class="arrow">←</span>
        {{ scheduleData?.data?.preDate || "无更早日期" }}
      </button>
      <div class="current-date">
        {{ currentDisplayDate }}
      </div>
      <button
        @click="changeDate('next')"
        class="nav-button"
        :disabled="!scheduleData?.data?.nextDate"
      >
        {{ scheduleData?.data?.nextDate || "无更晚日期" }}
        <span class="arrow">→</span>
      </button>
    </div>

    <!-- 比赛列表 - 每行一场比赛 -->
    <div class="games-list">
      <div v-for="group in scheduleData?.data?.groups" :key="group.date">
        <!-- 添加判断：当games数组为空时显示提示信息 -->
        <div v-if="group.games && group.games.length > 0">
          <div v-for="game in group.games" :key="game.gameId" class="game-card">
            <!-- 比赛时间 -->
            <div class="game-time" :class="getStatusClass(game.status)">
              美国时间：{{ formatGameTime(game.dateTimeUtc) }}
            </div>

            <!-- 比赛主要内容 -->
            <div class="game-main">
              <!-- 客队信息 -->
              <div
                class="team away-team"
                :class="{
                  'tbd-team': !game.teamValid,
                  winner: isWinner(game, 'away'), // 添加判断是否为胜者
                }"
              >
                <img
                  :src="game.awayTeamLogoDark"
                  :alt="game.awayTeamName"
                  class="team-logo"
                />
                <div class="team-info">
                  <div class="team-name">
                    <span class="city">{{ game.awayTeamCity }}</span>
                    <span class="name">{{ game.awayTeamName || "待定" }}</span>
                  </div>
                  <div class="team-record">
                    <span v-if="game.awayTeamWins !== undefined">
                      {{ game.awayTeamWins }}胜-{{ game.awayTeamLosses }}负
                    </span>
                  </div>
                </div>
                <div v-if="game.status !== 1" class="team-score">
                  {{ game.awayTeamScore }}
                </div>
              </div>

              <!-- 比赛状态 -->
              <div class="game-status">
                <div v-if="game.status === 1" class="game-not-started">
                  北京时间：{{ game.startTime }} 开始
                </div>
                <div v-else class="game-in-progress">
                  <div class="status-text">{{ game.statusText }}</div>
                  <div v-if="game.periodText" class="period-text">
                    {{ game.periodText }}
                  </div>
                  <div v-if="game.gameClock" class="game-clock">
                    {{ game.gameClock }}
                  </div>
                </div>
              </div>

              <!-- 主队信息 -->
              <div
                class="team home-team"
                :class="{
                  'tbd-team': !game.teamValid,
                  winner: isWinner(game, 'home'), // 添加判断是否为胜者
                }"
              >
                <img
                  :src="game.homeTeamLogoDark"
                  :alt="game.homeTeamName"
                  class="team-logo"
                />
                <div class="team-info">
                  <div class="team-name">
                    <span class="city">{{ game.homeTeamCity }}</span>
                    <span class="name">{{ game.homeTeamName || "待定" }}</span>
                  </div>
                  <div class="team-record">
                    <span v-if="game.homeTeamWins !== undefined">
                      {{ game.homeTeamWins }}胜-{{ game.homeTeamLosses }}负
                    </span>
                  </div>
                </div>
                <div v-if="game.status !== 1" class="team-score">
                  {{ game.homeTeamScore }}
                </div>
              </div>
            </div>

            <div class="live-buttons">
              <!-- 只有当比赛未结束且是当天比赛时才显示直播区域 -->
              <template v-if="game.status !== 3 && shouldShowLiveArea(game)">
                <template v-if="hasLiveStreams(game.gameId)">
                  <!-- 直播按钮 -->
                  <button
                    v-for="stream in getLiveStreams(game.gameId)"
                    :key="stream.type"
                    @click="goToLive(game, stream)"
                    class="live-btn"
                  >
                    <span class="btn-icon">📺</span>
                    {{ getStreamName(stream.type) }}
                  </button>
                </template>
                <div v-else class="no-live">无直播信号</div>
              </template>
              <div v-else-if="game.status === 3" class="no-live">
                比赛已结束
              </div>
              <div v-else class="no-live">未开始</div>
            </div>

            <!-- 比赛场地和赛季信息 -->
            <div class="game-footer">
              <div class="game-arena">
                <span v-if="game.arenaName">{{ game.arenaName }}</span>
                <span v-else>场地待定</span>
              </div>
              <div class="game-season">
                {{ game.seasonName }}
              </div>
            </div>
          </div>
        </div>
        <!-- 当没有比赛时显示提示信息 -->
        <div v-else class="no-games-message">
          {{ currentDisplayDate }} 当天没有NBA比赛
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
import { urls } from "@/api/nba";
import { onMounted } from "vue";
import { useGameStore } from "@/stores/game";
const gameStore = useGameStore();
const router = useRouter();
const urlsData = ref([]);

const shouldShowLiveArea = (game) => {
  // 1. 已结束的比赛不显示
  if (game.status === 3) return false;

  // 2. 获取今天的日期（北京时间）
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${(today.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${today.getDate().toString().padStart(2, "0")}`;

  // 3. 直接比较 startDate（已经是北京时间）
  return game.startDate === todayStr;
};

onMounted(async () => {
  try {
    const response = await urls();
    urlsData.value = response || [];
    // console.log("获取的直播URL数据:", urlsData.value); // 检查数据是否正确
  } catch (err) {
    console.error("获取直播URL失败:", err);
    urlsData.value = [];
  }
});

// 判断是否为当天进行中的比赛
const isLiveGame = (game) => {
  const isLive = game.status === 2; // 假设2表示进行中
  const gameDate = new Date(game.dateTimeUtc);
  const today = new Date();
  const isToday = gameDate.toDateString() === today.toDateString();
  return isLive && isToday;
};

// 检查比赛是否有直播流
const hasLiveStreams = (gameId) => {
  if (!urlsData.value || !gameId) return false;

  // 遍历所有直播流数据
  for (const streamGroup of urlsData.value) {
    if (streamGroup[gameId]) {
      return true;
    }
  }
  return false;
};

// 获取比赛的直播流
const getLiveStreams = (gameId) => {
  const id = String(gameId); // 转为字符串
  for (const streamGroup of urlsData.value) {
    if (streamGroup[id]) return streamGroup[id];
  }
  return [];
};

// 获取流名称
const getStreamName = (type) => {
  const names = {
    tx: "企鹅体育",
    wl: "纬来体育",
    nba: "高清原声",
    mg: "咪咕体育",
    zb: "高清直播",
    // 可以添加更多类型
  };
  return names[type] || type;
};

// 跳转到直播页面
const goToLive = (game, stream) => {
  // 准备比赛数据
  const gameData = {
    homeTeam: {
      name: game.homeTeamName,
      logo: game.homeTeamLogoDark,
      city: game.homeTeamCity,
      record: `${game.homeTeamWins}胜-${game.homeTeamLosses}负`,
    },
    awayTeam: {
      name: game.awayTeamName,
      logo: game.awayTeamLogoDark,
      city: game.awayTeamCity,
      record: `${game.awayTeamWins}胜-${game.awayTeamLosses}负`,
    },
    gameInfo: {
      arena: game.arenaName,
      season: game.seasonName,
    },
  };

  // 存储到Pinia
  gameStore.setCurrentGame({
    gameData,
    currentStream: stream,
    allStreams: getLiveStreams(game.gameId),
  });

  // 导航到播放页
  router.push({
    name: "Play",
    params: {
      gameId: game.gameId,
    },
  });
};

const props = defineProps({
  scheduleData: {
    type: Object,
    default: null,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["dateChange"]);

// 当前显示日期
// 当前显示日期（带星期几）
const currentDisplayDate = computed(() => {
  if (!props.scheduleData?.data?.start) return "加载中...";

  const dateStr = props.scheduleData.data.start;
  const date = new Date(dateStr);

  // 星期几的中文名称
  const weekdays = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六",
  ];
  const weekday = weekdays[date.getDay()];

  // 格式化日期为 YYYY年MM月DD日
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${year}年${month}月${day}日 ${weekday}`;
});

// 格式化比赛时间
const formatGameTime = (utcTime) => {
  if (!utcTime) return "时间待定";
  const date = new Date(utcTime);
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

// 获取比赛状态对应的样式类
const getStatusClass = (status) => {
  switch (status) {
    case 1:
      return "not-started"; // 未开始
    case 2:
      return "in-progress"; // 进行中
    case 3:
      return "finished"; // 已结束
    default:
      return "not-started";
  }
};

// 切换日期
const changeDate = (direction) => {
  if (!props.scheduleData?.data) return;

  const date =
    direction === "pre"
      ? props.scheduleData.data.preDate
      : props.scheduleData.data.nextDate;

  if (date) {
    emit("dateChange", date);
  }
};

// 判断某支球队是否是胜者
const isWinner = (game, teamType) => {
  // 如果比赛未结束，没有胜者
  if (game.status !== 3) return false;

  // 比较比分
  if (teamType === 'away') {
    return game.awayTeamScore > game.homeTeamScore;
  } else {
    return game.homeTeamScore > game.awayTeamScore;
  }
};
</script>

<style scoped>
.nba-schedule-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    "Helvetica Neue", Arial, sans-serif;
}
/* 添加未开播样式居中显示 */
.no-live {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  padding: 8px 16px;
  background-color: #808080;
  color: #ffffff;
  border-radius: 4px;
  text-align: center;
  font-size: 18px;
  font-weight: 600;
  margin: 0 auto;
}

/* 赞助商样式 */
.sponsor-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.sponsor-logo {
  height: 36px;
  margin-left: 12px;
}

/* 日期导航样式 */
.date-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e9ecef;
}

.current-date {
  font-size: 22px;
  font-weight: 600;
  color: #1d428a; /* NBA 蓝色 */
}

.nav-button {
  background: none;
  border: 1px solid #dee2e6;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 16px;
}

.nav-button:hover:not(:disabled) {
  background-color: #ffffff;
  border-color: #ffffff;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.arrow {
  font-weight: bold;
}

/* 比赛列表 - 每行一场比赛 */
.games-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

/* 比赛卡片样式 - 大气风格 */
.game-card {
  border: 1px solid #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}

.game-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

/* 比赛时间 */
.game-time {
  padding: 12px 20px;
  font-weight: 600;
  font-size: 16px;
  color: white;
}

.not-started {
  background-color: #6c757d; /* 灰色 - 未开始 */
}

.in-progress {
  background-color: #dc3545; /* 红色 - 进行中 */
}

.finished {
  background-color: #28a745; /* 绿色 - 已结束 */
}

/* 比赛主要内容 */
.game-main {
  padding: 20px;
}

/* 球队样式 */
.team {
  display: flex;
  align-items: center;
  padding: 15px 0;
  position: relative;
}

.team-logo {
  width: 60px;
  height: 60px;
  margin-right: 20px;
  object-fit: contain;
}

.team-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.team-name {
  display: flex;
  flex-direction: column;
}

.team-name .city {
  font-size: 14px;
  color: #6c757d;
}

.team-name .name {
  font-weight: 700;
  font-size: 20px;
  margin: 4px 0;
  color: #212529;
}

.team-record {
  font-size: 14px;
  color: #868e96;
}

.team-score {
  font-size: 28px;
  font-weight: 700;
  min-width: 60px;
  text-align: center;
  margin-left: 20px;
  color: #212529;
}

/* 待定球队样式 */
.tbd-team {
  opacity: 0.7;
}

/* 比赛状态 */
.game-status {
  padding: 12px 0;
  text-align: center;
  margin: 10px 0;
  border-top: 1px dashed #e9ecef;
  border-bottom: 1px dashed #e9ecef;
}

.game-not-started {
  color: #5a7cec;
  font-size: 18px;
}

.game-in-progress {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.status-text {
  font-weight: 700;
  color: #dc3545;
  font-size: 18px;
}

.period-text,
.game-clock {
  font-size: 14px;
  color: #6c757d;
}

/* 主队样式 */
.home-team {
  border-top: 1px solid #f1f3f5;
}

/* 比赛页脚 */
.game-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background-color: #f8f9fa;
  border-top: 1px solid #e9ecef;
}

.game-arena {
  font-size: 14px;
  color: #6c757d;
}

.game-season {
  font-size: 14px;
  font-weight: 600;
  color: #1d428a;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .game-card {
    margin: 0 10px;
  }

  .team {
    padding: 12px 0;
  }

  .team-logo {
    width: 50px;
    height: 50px;
    margin-right: 15px;
  }

  .team-name .name {
    font-size: 18px;
  }

  .team-score {
    font-size: 24px;
  }
}

@media (max-width: 480px) {
  .date-navigation {
    flex-direction: column;
    gap: 12px;
  }

  .nav-button {
    width: 100%;
    display: flex;
    justify-content: space-between;
  }

  .current-date {
    order: -1;
    margin-bottom: 8px;
  }

  .team-logo {
    width: 40px;
    height: 40px;
    margin-right: 12px;
  }

  .team-name .name {
    font-size: 16px;
  }

  .team-score {
    font-size: 20px;
    min-width: 50px;
  }
}

/* 新增直播间按钮样式 */
.live-buttons {
  display: flex;
  gap: 15px;
  padding: 15px 20px;
  border-top: 1px solid #f1f3f5;
  border-bottom: 1px solid #f1f3f5;
}

.live-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.live-btn.primary {
  background-color: #1d428a;
  color: white;
}

.live-btn.primary:hover {
  background-color: #15316e;
}

.live-btn.secondary {
  background-color: #f8f9fa;
  color: #1d428a;
  border: 1px solid #dee2e6;
}

.live-btn.secondary:hover {
  background-color: #e9ecef;
}

.btn-icon {
  font-size: 18px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .live-buttons {
    flex-direction: column;
    gap: 10px;
  }

  .live-btn {
    padding: 10px;
  }
}
.no-games-message {
  text-align: center;
  padding: 40px;
  font-size: 18px;
  color: #666;
  background-color: #f8f8f8;
  border-radius: 8px;
  margin: 20px 0;
}
/* 胜者背景色 */
.team.winner {
  background-color: rgba(76, 175, 80, 0.1); /* 浅绿色背景 */
  border-left: 3px solid #74fd79; /* 左侧绿色边框 */
}

/* 如果希望更明显的效果，可以调整样式 */
.team.winner .team-name {
  font-weight: bold;
  color: #2E7D32; /* 深绿色文字 */
}

.team.winner .team-score {
  font-weight: bold;
  color: #2E7D32; /* 深绿色比分 */
}
</style>
