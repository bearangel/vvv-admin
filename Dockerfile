# 使用Nginx Alpine镜像
FROM nginx:alpine

# 删除默认配置
RUN rm -rf /etc/nginx/conf.d/*

# 添加自定义Nginx配置
COPY nginx.conf /etc/nginx/conf.d/

# 复制构建后的静态文件
COPY dist /usr/share/nginx/html

# 暴露80端口
EXPOSE 80

# 启动Nginx
CMD ["nginx", "-g", "daemon off;"]