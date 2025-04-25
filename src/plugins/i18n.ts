import { createI18n } from 'vue-i18n'
import enUS from '@/locales/en-US'
import zhCN from '@/locales/zh-CN'
import zhTW from '@/locales/zh-TW'

// 获取本地存储的语言设置，如果没有则使用默认语言
const storedLanguage = localStorage.getItem('language-store')
const defaultLocale = storedLanguage
  ? JSON.parse(storedLanguage).currentLanguage
  : 'zh-CN'

// 创建i18n实例
const i18n = createI18n({
  legacy: false, // 使用组合式API
  locale: defaultLocale, // 设置默认语言
  fallbackLocale: 'en-US', // 设置回退语言
  messages: {
    'en-US': enUS,
    'zh-CN': zhCN,
    'zh-TW': zhTW
  }
})

export default i18n
