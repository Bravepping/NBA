// router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import IndexVue from '@/views/Index.vue'
import PlayVue from '@/views/Play.vue'
const routes = [
  {
    path: '/',
    name: 'Index',
    component: IndexVue,
    props: route => ({ query: route.query })
  },
  {
    path: '/play',
    name: 'Play',
    component: PlayVue,
    props: route => ({ query: route.query })
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router