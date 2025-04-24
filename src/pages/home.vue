<template>
  <!-- 左侧菜单栏 -->
  <v-navigation-drawer class="fill-height">
    <!-- 系统logo和名称 -->
    <div class="d-flex align-center logo-container">
      <img src="@/assets/logo.svg" alt="Logo" height="32" class="mr-2" />
      <h2>VVV Admin</h2>
    </div>

    <!-- 菜单列表 -->
    <v-list>
      <v-list-item
        v-for="(item, i) in menuItems"
        :key="i"
        :value="item"
        :title="item.title"
        :prepend-icon="item.icon"
      ></v-list-item>
    </v-list>
  </v-navigation-drawer>

  <!-- 顶部工具条 -->
  <v-app-bar color="primary" density="comfortable">
    <v-spacer></v-spacer>
    <!-- 设置按钮 -->
    <v-btn icon @click="openSettings">
      <v-icon>mdi-cog</v-icon>
    </v-btn>
    <!-- 明暗主题切换按钮 -->
    <v-btn icon @click="toggleTheme">
      <v-icon>{{ themeStore.isDark ? 'mdi-weather-night' : 'mdi-weather-sunny' }}</v-icon>
    </v-btn>
    <!-- 国际化按钮 -->
    <v-btn icon @click="toggleLanguage">
      <v-icon>mdi-translate</v-icon>
    </v-btn>
    <!-- 全屏按钮 -->
    <v-btn icon @click="toggleFullscreen">
      <v-icon>mdi-fullscreen</v-icon>
    </v-btn>
    <!-- 通知按钮 -->
    <v-btn icon @click="openNotifications">
      <v-icon>mdi-bell</v-icon>
    </v-btn>
    <!-- 个人头像 -->
    <v-btn icon @click="openUserProfile">
      <v-icon>mdi-account</v-icon>
    </v-btn>
  </v-app-bar>

  <!-- 右侧功能区 -->
  <v-main class="fill-height pa-0">
    <v-card class="fill-height rounded-0">
      <v-card-title>欢迎使用 VVV Admin</v-card-title>
      <v-card-text>
        <p>这是主页内容区域，您可以在这里添加您的应用功能。</p>
      </v-card-text>
    </v-card>
  </v-main>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// 菜单项数据
const menuItems = [
  {title: '仪表盘', icon: 'mdi-view-dashboard'},
  {title: '用户管理', icon: 'mdi-account-group'},
  {title: '设置', icon: 'mdi-cog'},
  {title: '帮助', icon: 'mdi-help-circle'},
];

// 主题切换
import { useThemeStore } from '@/stores/themeStore';
const themeStore = useThemeStore();
const toggleTheme = () => {
  themeStore.toggleTheme();
};

// 全屏切换
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`全屏错误: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

// 打开设置
const openSettings = () => {
  console.log('打开设置');
};

// 切换语言
const toggleLanguage = () => {
  console.log('切换语言');
};

// 打开通知
const openNotifications = () => {
  console.log('打开通知');
};

// 打开用户信息
const openUserProfile = () => {
  console.log('打开用户信息');
};
</script>

<style scoped>
.logo-container {
  height: 48px; /* 与工具栏高度一致 */
  padding-left: 16px;
  padding-right: 16px;
}
</style>
