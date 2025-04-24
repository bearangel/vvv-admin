import { defineStore } from "pinia";

export const useThemeStore = defineStore("theme", {
  state: () => ({
    isDark: true // 默认使用暗色主题
  }),
  persist: {
    storage: localStorage // 使用localStorage持久化主题设置
  },
  actions: {
    /**
     * 切换主题
     */
    toggleTheme() {
      this.isDark = !this.isDark;
    },
    /**
     * 设置主题
     * @param isDark 是否为暗色主题
     */
    setTheme(isDark: boolean) {
      this.isDark = isDark;
    }
  },
  getters: {
    /**
     * 获取当前主题名称
     */
    currentTheme(): string {
      return this.isDark ? 'dark' : 'light';
    }
  }
});
