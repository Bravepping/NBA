<template>
    <!-- <LiveStream
        :liveUrl="liveUrl"
        :streamType="streamType"
        :gameInfo="gameInfo"
        @goBack="goBack"
    /> -->
    <LiveStream />
</template>

<script setup>
import LiveStream from '@/components/LiveStream.vue';
// import { ref } from 'vue';
// import { useRoute, useRouter } from 'vue-router'

// const route = useRoute(); // 注意这里改成了 route 而不是 useRoute
// const liveUrl = ref('');
// liveUrl.value = route.query.url;
// console.log('play页面接收的直播地址:', liveUrl.value);


</script>

<style lang="scss" scoped>

</style>