<template>
    <div>
      <NBASchedule
        :scheduleData="scheduleData"
        :loading="loading"
        :error="error"
        @dateChange="handleDateChange"
      />
  
      <el-backtop :right="50" :bottom="50" />
    </div>
  </template>
  
  <script setup>
  import { ref } from "vue";
  import NBASchedule from "@/components/NBASchedule.vue";
  import { schedule,games } from "@/api/nba";
  
  const scheduleData = ref(null);
  const loading = ref(false);
  const error = ref(null);
  
  // 获取当前时间戳（秒）
  const currentTimestamp = Math.floor(Date.now() / 1000);
  
  // 构造请求参数
  const params = {
    app_key: "tiKB2tNdncnZFPOi",
    app_version: "1.1.0",
    channel: "NBA",
    device_id: "cd4920b68041f06fcc6ea358c85710bd",
    // end: "2025-04-17",
    install_id: "1502934360",
    network: "N/A",
    os_type: "3",
    os_version: "1.0.0",
    sign: "sign_v2",
    sign2: "67BB8937A32E512826D59467E803B28CD82E179FCE8B2A470C20AA0BD4AE08DB",
    // start: "2025-04-17",
    //开始结束设置为当天
    start: currentTimestamp,
    end: currentTimestamp,
    t: currentTimestamp,
  };
  
  // 获取赛程数据
  const fetchScheduleData = async () => {
    loading.value = true;
    error.value = null;
    try {
      const response = await schedule(params);
      scheduleData.value = response;
      // console.log("赛程数据:", response);
      
    } catch (err) {
      error.value = err.message || "获取赛程数据失败";
      console.error("获取赛程数据失败:", err);
    } finally {
      loading.value = false;
    }
  };
  
  // 处理日期变更
  const handleDateChange = (date) => {
    params.start = date;
    params.end = date;
    fetchScheduleData();
  };
  
  // 初始加载数据
  fetchScheduleData();
  </script>
  
  <style scoped></style>
  