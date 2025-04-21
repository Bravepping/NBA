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
              <img :src="game.homeTeamLogoDark" :alt="game.homeTeamName" class="team-logo" />
              <span class="team-name">{{ game.homeTeamName }}</span>
            </div>
            <span class="vs">VS</span>
            <div class="team">
              <img :src="game.awayTeamLogoDark" :alt="game.awayTeamName" class="team-logo" />
              <span class="team-name">{{ game.awayTeamName }}</span>
            </div>
          </div>

          <span class="start-time">{{ formatTime(game.startTime) }}</span>

          <!-- 直播链接区域 -->
          <div v-if="getGameUrls(game.gameId).length > 0" class="urls-container">
            <div v-for="(url, index) in getGameUrls(game.gameId)" :key="index" class="url-item">
              <span class="url-type">{{ formatUrlType(url.type) }}:</span>
              <span class="truncated-url" @click="showFullUrl(url.url)">
                {{ truncateUrl(url.url) }}
              </span>
              <button class="check-btn" @click.stop="showFullUrl(url.url)">
                <i class="el-icon-view"></i> 查看
              </button>
              <button class="delete-btn" @click.stop="deleteUrl(url.id)">
                <i class="el-icon-delete"></i> 删除
              </button>
            </div>
          </div>
          <div v-else class="no-urls">暂无直播链接</div>
        </div>

        <button class="add-url-btn" @click="openAddUrlDialog(game)">
          添加直播
        </button>
      </div>
    </div>

    <!-- URL详情弹窗 -->
    <el-dialog v-model="urlDialogVisible" title="直播链接详情" width="50%" center>
      <div class="url-dialog-content">
        <div class="full-url">{{ currentUrl }}</div>
        <el-button type="primary" @click="copyUrl(currentUrl)">复制链接</el-button>
      </div>
    </el-dialog>

    <!-- 添加直播URL对话框 -->
    <div v-if="showDialog" class="dialog-overlay">
      <div class="dialog-content">
        <h3>为 {{ selectedGame.homeTeamName }} VS {{ selectedGame.awayTeamName }} 添加直播URL</h3>

        <div class="url-inputs">
          <div v-for="(url, index) in newUrls" :key="index" class="url-input-item">
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

            <button v-if="newUrls.length > 1" class="remove-btn" @click="removeUrl(index)">
              <i class="el-icon-remove"></i> 删除
            </button>
          </div>
        </div>

        <button class="add-more-btn" @click="addMoreUrl">
          <i class="el-icon-circle-plus"></i> 添加更多直播源
        </button>

        <div class="dialog-footer">
          <button class="cancel-btn" @click="closeDialog">取消</button>
          <button class="confirm-btn" @click="submitUrls" :disabled="isSubmitting">
            <span v-if="!isSubmitting">确认添加</span>
            <span v-else>正在提交...</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage, ElLoading } from "element-plus";
import { games, urls, addUrls as apiAddUrls, go, deleteUrlById } from "@/api/nba";

// 响应式状态
const gamesData = ref([]);
const urlData = ref([]);
const showDialog = ref(false);
const selectedGame = ref(null);
const newUrls = ref([{ type: "tx", url: "" }]);
const isSubmitting = ref(false);
const urlDialogVisible = ref(false);
const currentUrl = ref('');

// 初始化数据
const initData = async () => {
  try {
    const [urlsRes, gamesRes] = await Promise.all([urls(), games()]);
    urlData.value = urlsRes || [];
    gamesData.value = gamesRes || [];
  } catch (err) {
    console.error("获取数据失败:", err);
    ElMessage.error("获取比赛数据失败，请刷新重试");
  }
};

// URL处理函数
const truncateUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname.substring(0, 20)}...`;
  } catch {
    return url.length > 30 ? `${url.substring(0, 30)}...` : url;
  }
};

const showFullUrl = (url) => {
  currentUrl.value = url;
  urlDialogVisible.value = true;
};

const copyUrl = (url) => {
  navigator.clipboard.writeText(url)
    .then(() => {
      ElMessage.success('链接已复制');
      urlDialogVisible.value = false;
    })
    .catch(() => ElMessage.error('复制失败'));
};

// 删除URL
const deleteUrl = async (id) => {
  let loading = null;
  
  try {
    const confirm = window.confirm('确定要删除这个直播链接吗？');
    if (!confirm) return;
    
    loading = ElLoading.service({
      lock: true,
      text: "正在删除直播链接...",
      background: "rgba(0, 0, 0, 0.7)",
    });
    
    await deleteUrlById(id);
    
    urlData.value = urlData.value.map(gameUrl => {
      const gameId = Object.keys(gameUrl)[0];
      return {
        [gameId]: gameUrl[gameId].filter(url => url.id !== id)
      };
    });
    
    ElMessage.success('直播链接删除成功');
  } catch (error) {
    console.error('删除直播链接失败:', error);
    ElMessage.error(`删除失败: ${error.message || "服务器错误"}`);
  } finally {
    loading?.close();
  }
};

// 添加URL相关函数
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

const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const submitUrls = async () => {
  const validUrls = newUrls.value
    .filter(item => item.url.trim() !== "")
    .map(item => ({
      type: item.type,
      url: item.url.trim(),
    }));

  if (validUrls.length === 0) {
    ElMessage.warning("请至少输入一个有效的直播URL");
    return;
  }

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
    const response = await apiAddUrls(selectedGame.value.gameId, validUrls);
    updateLocalUrls(selectedGame.value.gameId, response.data || validUrls);
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

const updateLocalUrls = (gameId, urlsToAdd) => {
  const newUrlData = [...urlData.value];
  const existingIndex = newUrlData.findIndex(item => Object.keys(item)[0] === gameId.toString());

  if (existingIndex >= 0) {
    const existingItem = { ...newUrlData[existingIndex] };
    existingItem[gameId] = [...existingItem[gameId], ...urlsToAdd];
    newUrlData[existingIndex] = existingItem;
  } else {
    newUrlData.push({ [gameId]: urlsToAdd });
  }

  urlData.value = newUrlData;
};

// 工具函数
const getGameUrls = (gameId) => {
  const gameUrls = urlData.value.find(item => item[gameId]);
  return gameUrls ? gameUrls[gameId] : [];
};

const formatUrlType = (type) => {
  const typeMap = {
    tx: "腾讯", wl: "纬来", mg: "咪咕", 
    nba: "原声", zb: "其他", qq: "腾讯", wx: "微信"
  };
  return typeMap[type] || type;
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const formatTime = (timeString) => {
  const time = new Date(timeString);
  return `${time.getHours()}:${time.getMinutes().toString().padStart(2, "0")}`;
};

// 生命周期钩子
onMounted(() => {
  initData();
  
  const storedPassword = localStorage.getItem("password");
  if (storedPassword && storedPassword === "inspur123") return;
  
  const password = prompt("请输入密码：");
  go(password)
    .then(response => {
      if (response) {
        localStorage.setItem("password", password);
      } else {
        window.location.href = "/";
      }
    })
    .catch(() => window.location.href = "/");
});
</script>

<style lang="scss" scoped>
.games-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  
  h2 {
    text-align: center;
    margin-bottom: 20px;
    color: #333;
  }
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
  flex-direction: column;
  gap: 10px;
  flex-grow: 1;
  
  .game-date, .game-id, .start-time {
    font-size: 14px;
    color: #666;
  }
}

.teams {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin: 10px 0;
  
  .vs {
    font-weight: bold;
    color: #e63946;
  }
}

.team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
  
  .team-logo {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  
  .team-name {
    font-size: 14px;
    font-weight: 500;
  }
}

.urls-container {
  margin-top: 10px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  
  .url-item {
    display: flex;
    align-items: center;
    padding: 8px;
    margin-bottom: 8px;
    background-color: #fff;
    border-radius: 4px;
    
    &:hover {
      background-color: #f0f0f0;
    }
    
    .url-type {
      font-weight: bold;
      min-width: 50px;
    }
    
    .truncated-url {
      flex: 1;
      color: #409eff;
      cursor: pointer;
      text-decoration: underline;
      margin: 0 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      
      &:hover {
        color: #66b1ff;
      }
    }
    
    .check-btn {
      padding: 4px 8px;
      background-color: #987eff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      
      &:hover {
        background-color: #7d5fff;
      }
    }
    
    .delete-btn {
      margin-left: 8px;
      padding: 4px 8px;
      background-color: #ff4444;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      
      &:hover {
        background-color: #cc0000;
      }
    }
  }
}

.no-urls {
  margin-top: 10px;
  color: #999;
  font-style: italic;
}

.add-url-btn {
  padding: 8px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-start;
  
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
  
  h3 {
    margin-top: 0;
    color: #333;
    text-align: center;
    margin-bottom: 20px;
  }
}

.url-inputs {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.url-input-item {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 15px;
  position: relative;
}

.form-group {
  margin-bottom: 15px;
  
  label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
  }
  
  input, select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    box-sizing: border-box;
  }
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

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  
  .cancel-btn {
    padding: 8px 15px;
    background-color: #f5f5f5;
    color: #333;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: #e0e0e0;
    }
  }
  
  .confirm-btn {
    padding: 8px 15px;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background-color: #0b7dda;
    }
    
    &:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
  }
}

/* URL详情弹窗样式 */
.url-dialog-content {
  text-align: center;
  
  .full-url {
    padding: 10px;
    margin: 15px 0;
    background-color: #f5f5f5;
    border-radius: 4px;
    word-break: break-all;
  }
  
  .el-button {
    margin: 0 10px;
  }
}
</style>