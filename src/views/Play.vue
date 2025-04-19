<template>
    <LiveStream @goBack="goBack" />
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import LiveStream from '@/components/LiveStream.vue'
  
  const router = useRouter()
  
  const goBack = () => {
    router.go(-1)
  }
  </script>
  
  <style lang="scss" scoped>
  /* 可以添加一些页面样式 */
  </style>