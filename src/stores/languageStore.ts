import { defineStore } from "pinia";
import i18n from "@/plugins/i18n";

export const useLanguageStore = defineStore("language", {
  state: () => ({
    currentLanguage: "zh-CN" // 默认使用简体中文
  }),
  persist: {
    storage: localStorage // 使用localStorage持久化语言设置
  },
  actions: {
    /**
     * 设置语言
     * @param lang 语言代码
     */
    setLanguage(lang: string) {
      this.currentLanguage = lang;
      i18n.global.locale.value = lang; // 更新i18n的当前语言
    }
  },
  getters: {
    /**
     * 获取当前语言代码
     */
    language(): string {
      return this.currentLanguage;
    },
    /**
     * 获取当前语言名称
     */
    languageName(): string {
      const languageMap: Record<string, string> = {
        "zh-CN": "简体中文",
        "zh-TW": "繁體中文",
        "en-US": "English"
      };
      return languageMap[this.currentLanguage] || "简体中文";
    }
  }
});
