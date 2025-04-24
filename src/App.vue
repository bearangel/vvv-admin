<template>
  <v-app :theme="themeStore.currentTheme">
    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts" setup>
  import { useThemeStore } from '@/stores/themeStore';
  import { watch } from 'vue';

  const themeStore = useThemeStore();

  // 监听主题变化，可以在这里添加额外的主题相关逻辑
  watch(() => themeStore.isDark, (newValue) => {
    console.log('主题已切换为:', newValue ? '暗色' : '亮色');
  });
</script>
