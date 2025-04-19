// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import IndexVue from '@/views/Index.vue'
import PlayVue from '@/views/Play.vue'
import AdminVue from '@/views/Admin.vue'
import { useGameStore } from '@/stores/game'
import TestVue from '@/views/Test.vue'

const routes = [
  {
    path: '/',
    name: 'Index',
    component: IndexVue,
    props: route => ({ query: route.query })
  },
  {
    path: '/play/:gameId',
    name: 'Play',
    component: () => import('@/views/Play.vue'),
    props: true // 启用props接收路由参数
  },
  {
    path: '/lives',
    name: 'Admin',
    component: AdminVue,
  },
  {
    path: '/test',
    name: 'Test',
    component: TestVue,
  },
  // 添加通配符路由，捕获所有未匹配的路径
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 添加全局路由守卫
router.beforeEach((to, from) => {
  const gameStore = useGameStore()
  
  // 离开播放页时清理数据
  if (from.name === 'Play' && to.name !== 'Play') {
    gameStore.clearGameData()
  }
  
  // 进入播放页时检查数据
  if (to.name === 'Play' && !gameStore.currentGame) {
    return '/' // 无数据则重定向到首页
  }
})

export default router