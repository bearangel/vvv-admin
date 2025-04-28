# Project Guidelines

## 项目说明
vvv-admin是一个基于vue项目，使用typescript作为项目开发语言，基于vite构建，UI使用vuetify构建，使用vue-router框架管理页面路由，单元测试框架使用vitest，状态管理使用pinia，使用inversify作为项目的ioc容器。

## 项目结构
1. **主要文件**
    - `App.vue` - Vue应用的根组件
    - `main.ts` - 应用的入口文件，负责Vue应用的初始化

2. **核心目录**
    - `components/` - 存放可复用的Vue组件
    - `pages/` - 存放页面级组件
    - `router/` - Vue Router路由配置
    - `stores/` - Pinia状态管理相关文件
    - `services/` - 服务层，用于处理API调用等
    - `plugins/` - Vue插件和第三方库的配置

3. **资源和工具**
    - `assets/` - 静态资源文件(图片、字体等)
    - `styles/` - 全局样式文件
    - `utils/` - 工具函数和helper
    - `lib/` - 第三方库或自定义库
    - `models/` - 数据模型定义
    - `locales/` - 国际化文件

4. **运维工具**
   - `sql` - sql脚本，有限支持postgresql数据库

## 研发要求
1、本系统是一个多租户系统，所有业务模型都要去必须继承`src/models/baseModel.ts`, 所有业务功能都必须通过租户ID做数据隔离。
2、所有服务层都应该提供Mock实现和Supabase实现。并且支持日后扩展其他第三方系统实现。并且支持通过环境变量`VITE_SERVICE_TYPE`区分系统调用那个服务。
3、每一个业务模块都需要提供对应的sql脚本（存放在`devops/sql`目录中），一份详细的api文档。
4、所有代码注释请尽量使用中文， 如果存在一些无法翻译专有名词，比如项目名称等则无需翻译。
5、在代码中所有需要显示的文本内容都需要使用国际化组件，注意在根据vue-i18n在typescript支持说中要求api`$t`需要用`t`替代。
6、代码中所有提示信息默认使用简体中文。并且在国际化配置中提及简体中文、繁体中文、英文三份配置。
7、每个业务菜单。如无特殊说明，直接通过路由显示在`src/pages/home.vue`的功能区功能区

## vuetify UI规范
1、输入框variant属性，如无特殊要求，默认使用underlined
2、输入框图标，如无特殊要求，前图标使用append-icon，后图标使用prepend-inner-icon
3、所有提示信息，如果没有特殊要求，请使用v-snackbar，并且设置location="top right"