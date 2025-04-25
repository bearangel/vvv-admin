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
        :title="t(item.titleKey)"
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
    <!-- 国际化下拉菜单 -->
    <v-menu
      v-model="languageMenu"
      location="bottom"
    >
      <template v-slot:activator="{ props }">
        <v-btn icon v-bind="props">
          <v-icon>mdi-translate</v-icon>
        </v-btn>
      </template>
      <v-list>
        <v-list-item
          @click="changeLanguage('zh-CN')"
          :active="currentLanguage === 'zh-CN'"
        >
          <v-list-item-title>简体中文</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="changeLanguage('zh-TW')"
          :active="currentLanguage === 'zh-TW'"
        >
          <v-list-item-title>繁體中文</v-list-item-title>
        </v-list-item>
        <v-list-item
          @click="changeLanguage('en-US')"
          :active="currentLanguage === 'en-US'"
        >
          <v-list-item-title>English</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
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
      <v-card-title>{{ t('common.welcome') }}</v-card-title>
      <v-card-text>
        <p>{{ t('common.mainContent') }}</p>
      </v-card-text>
    </v-card>
  </v-main>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useLanguageStore } from '@/stores/languageStore';

// i18n
const { t } = useI18n();

// 语言设置
const languageStore = useLanguageStore();
const currentLanguage = computed(() => languageStore.language);
const currentLanguageName = computed(() => languageStore.languageName);

// 菜单项数据
const menuItems = [
  {titleKey: 'home.menu.dashboard', icon: 'mdi-view-dashboard'},
  {titleKey: 'home.menu.userManagement', icon: 'mdi-account-group'},
  {titleKey: 'home.menu.settings', icon: 'mdi-cog'},
  {titleKey: 'home.menu.help', icon: 'mdi-help-circle'},
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
      console.error(`${t('home.fullscreenError')}: ${err.message}`);
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
const changeLanguage = (lang: string) => {
  languageStore.setLanguage(lang);
};

// 语言菜单控制
const languageMenu = ref(false);

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
