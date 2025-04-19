<template>
  <div class="games-container">
    <h2>NBA赛事列表</h2>

    <div class="game-list">
      <div v-for="game in gamesData" :key="game.id" class="game-item">
        <div class="game-info">
          <span class="game-date">{{ formatDate(game.date) }}</span>
          <span class="game-id">ID: {{ game.gameId }}</span>

          <div class="teams">
            <div class="team">
              <img
                :src="game.homeTeamLogoDark"
                :alt="game.homeTeamName"
                class="team-logo"
              />
              <span class="team-name">{{ game.homeTeamName }}</span>
            </div>
            <span class="vs">VS</span>
            <div class="team">
              <img
                :src="game.awayTeamLogoDark"
                :alt="game.awayTeamName"
                class="team-logo"
              />
              <span class="team-name">{{ game.awayTeamName }}</span>
            </div>
          </div>

          <span class="start-time">{{ formatTime(game.startTime) }}</span>

          <!-- 显示直播URL -->
          <div
            v-if="getGameUrls(game.gameId).length > 0"
            class="urls-container"
          >
            <h4>直播链接:</h4>
            <div
              v-for="(url, index) in getGameUrls(game.gameId)"
              :key="index"
              class="url-item"
            >
              <span class="url-type">{{ formatUrlType(url.type) }}:</span>
              <a :href="url.url" target="_blank" class="url-link">{{
                url.url
              }}</a>
            </div>
          </div>
          <div v-else class="no-urls">暂无直播链接</div>
        </div>

        <button class="add-url-btn" @click="openAddUrlDialog(game)">
          添加直播
        </button>
      </div>
    </div>

    <!-- 添加直播URL的对话框 -->
    <!-- 添加直播URL的对话框 -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3>
          为 {{ selectedGame.homeTeamName }} VS
          {{ selectedGame.awayTeamName }} 添加直播URL
        </h3>

        <div class="url-inputs">
          <div v-for="(url, index) in newUrls" :key="index" class="url-item">
            <div class="form-group">
              <label>直播类型 {{ index + 1 }}:</label>
              <select v-model="url.type" class="url-type-select">
                <option value="tx">腾讯体育</option>
                <option value="mg">咪咕视频</option>
                <option value="wl">纬来体育</option>
                <option value="nba">NBA原声</option>
                <option value="zb">其他平台</option>
              </select>
            </div>

            <div class="form-group">
              <label>直播地址 {{ index + 1 }}:</label>
              <input
                v-model="url.url"
                type="text"
                placeholder="请输入完整的直播URL"
                class="url-input"
              />
            </div>

            <button
              v-if="newUrls.length > 1"
              class="remove-btn"
              @click="removeUrl(index)"
            >
              <i class="el-icon-remove"></i> 删除
            </button>
          </div>
        </div>

        <button class="add-more-btn" @click="addMoreUrl">
          <i class="el-icon-circle-plus"></i> 添加更多直播源
        </button>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button
            class="confirm-btn"
            @click="submitUrls"
            :disabled="isSubmitting"
          >
            <span v-if="!isSubmitting">确认添加</span>
            <span v-else>正在提交...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeMount } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import { games, urls, addUrls as apiAddUrls,go } from "@/api/nba";

// 组件状态
const gamesData = ref([]);
const urlData = ref([]);
const showDialog = ref(false);
const selectedGame = ref(null);
const newUrls = ref([{ type: "tx", url: "" }]);
const isSubmitting = ref(false);

// 获取比赛和URL数据
onMounted(async () => {
  try {
    const [urlsRes, gamesRes] = await Promise.all([urls(), games()]);
    urlData.value = urlsRes || [];
    gamesData.value = gamesRes || [];
  } catch (err) {
    console.error("获取数据失败:", err);
    ElMessage.error("获取比赛数据失败，请刷新重试");
  }
});

// 提交直播链接
const submitUrls = async () => {
  // 验证URL格式
  const validUrls = newUrls.value
    .filter((item) => item.url.trim() !== "")
    .map((item) => ({
      type: item.type,
      url: item.url.trim(),
    }));

  if (validUrls.length === 0) {
    ElMessage.warning("请至少输入一个有效的直播URL");
    return;
  }

  // 验证URL格式是否正确
  for (const url of validUrls) {
    if (!isValidUrl(url.url)) {
      ElMessage.warning(`直播地址格式不正确: ${url.url}`);
      return;
    }
  }

  isSubmitting.value = true;
  const loading = ElLoading.service({
    lock: true,
    text: "正在提交直播链接...",
    background: "rgba(0, 0, 0, 0.7)",
  });

  try {
    // 调用API添加URL
    await apiAddUrls(selectedGame.value.gameId, validUrls);

    // 更新本地数据
    updateLocalUrls(selectedGame.value.gameId, validUrls);

    ElMessage.success("直播链接添加成功！");
    closeDialog();
  } catch (error) {
    console.error("添加直播URL失败:", error);
    ElMessage.error(`添加失败: ${error.message || "服务器错误"}`);
  } finally {
    loading.close();
    isSubmitting.value = false;
  }
};

// 更新本地URL数据
const updateLocalUrls = (gameId, urlsToAdd) => {
  const existingIndex = urlData.value.findIndex(
    (item) => item.gameId === gameId
  );

  if (existingIndex >= 0) {
    // 合并现有URL
    urlData.value[existingIndex].urls = [
      ...urlData.value[existingIndex].urls,
      ...urlsToAdd,
    ];
  } else {
    // 添加新比赛URL
    urlData.value.push({
      gameId,
      urls: urlsToAdd,
    });
  }
};

// URL验证函数
const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

onBeforeMount(async () => {
  const storedPassword = localStorage.getItem("password");
  if (storedPassword && storedPassword == "inspur123") {
    console.log("=======进入后台======");
    // return;
  } else {
    const password = prompt("请输入密码：");
    try {
      const response = await go(password);
      if (response == true) {
        // console.log("=======进入后台======");
        localStorage.setItem("password", password);
      } else {
        // console.log("==========密码错误=========");
        window.location.href = "/";
        return;
      }
    } catch (err) {
    //   console.error("验证密码失败:", err);
      window.location.href = "/";
    }
  }
});

onMounted(async () => {
  try {
    const [res_urls, response] = await Promise.all([urls(), games()]);
    urlData.value = res_urls || [];
    gamesData.value = response || [];
  } catch (err) {
    console.error("获取数据失败:", err);
    gamesData.value = [];
    urlData.value = [];
  }
});

// 根据gameId获取对应的URLs
const getGameUrls = (gameId) => {
  const gameUrls = urlData.value.find((item) => item[gameId]);
  return gameUrls ? gameUrls[gameId] : [];
};

// 格式化URL类型显示
const formatUrlType = (type) => {
  const typeMap = {
    tx: "腾讯",
    wl: "纬来",
    mg: "咪咕",
    nba: "原声",
    zb: "其他",
    qq: "腾讯",
    wx: "微信",
  };
  return typeMap[type] || type;
};

const openAddUrlDialog = (game) => {
  selectedGame.value = game;
  newUrls.value = [{ type: "tx", url: "" }];
  showDialog.value = true;
};

const closeDialog = () => {
  showDialog.value = false;
};

const addMoreUrl = () => {
  newUrls.value.push({ type: "tx", url: "" });
};

const removeUrl = (index) => {
  newUrls.value.splice(index, 1);
};

const addUrls = async () => {
  const validUrls = newUrls.value.filter((item) => item.url.trim() !== "");

  if (validUrls.length === 0) {
    alert("请至少输入一个有效的直播URL");
    return;
  }

  const payload = {
    gameId: selectedGame.value.gameId,
    urls: validUrls,
  };

  try {
    // console.log("提交的数据:", payload);
    alert("直播URL添加成功!");
    closeDialog();
  } catch (error) {
    console.error("添加直播URL失败:", error);
    alert("添加失败，请重试");
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatTime = (timeString) => {
  const time = new Date(timeString);
  return `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`;
};
</script>

<style lang="scss" scoped>
/* 添加一些样式使URL显示更美观 */
.urls-container {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.url-item {
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.url-type {
  font-weight: bold;
  margin-right: 8px;
  min-width: 40px;
}

.url-link {
  color: #0066cc;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.no-urls {
  margin-top: 10px;
  color: #999;
  font-style: italic;
}
.games-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #333;
}

.game-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.game-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.game-date,
.game-id,
.start-time {
  font-size: 14px;
  color: #666;
}

.teams {
  display: flex;
  align-items: center;
  gap: 10px;
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.team-logo {
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.team-name {
  font-size: 14px;
  font-weight: 500;
}

.vs {
  font-weight: bold;
  color: #e63946;
}

.add-url-btn {
  padding: 8px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: #45a049;
  }
}

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-content {
  background-color: white;
  padding: 25px;
  border-radius: 8px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.dialog-content h3 {
  margin-top: 0;
  color: #333;
  text-align: center;
  margin-bottom: 20px;
}

.url-inputs {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.url-item {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  position: relative;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4444;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 2px 8px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background-color: #cc0000;
  }
}

.add-more-btn {
  width: 100%;
  padding: 8px;
  background-color: #f5f5f5;
  border: 1px dashed #ccc;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 15px;

  &:hover {
    background-color: #e0e0e0;
  }
}

.dialog-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn,
.confirm-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #333;

  &:hover {
    background-color: #e0e0e0;
  }
}

.confirm-btn {
  background-color: #2196f3;
  color: white;

  &:hover {
    background-color: #0b7dda;
  }
}
</style>
