import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useGameStore = defineStore('game', () => {
  // 状态
  const _currentGame = ref(null)
  const _currentStream = ref(null)
  const _allStreams = ref([])

  // 计算属性（保持响应式）
  const currentGame = computed(() => _currentGame.value)
  const allStreams = computed(() => _allStreams.value)
  const currentStream = computed({
    get: () => _currentStream.value,
    set: (val) => _currentStream.value = val // 确保可写
  })

  // 设置当前比赛
  const setCurrentGame = (data) => {
    _currentGame.value = data.gameData
    _currentStream.value = data.currentStream
    _allStreams.value = data.allStreams
  }

  // 清除数据
  const clearGameData = () => {
    _currentGame.value = null
    _currentStream.value = null
    _allStreams.value = []
  }

  return {
    currentGame,
    currentStream,
    allStreams,
    setCurrentGame,
    clearGameData
  }
})