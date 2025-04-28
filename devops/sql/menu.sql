-- 创建菜单表
CREATE TABLE IF NOT EXISTS menus (
  gid UUID PRIMARY KEY,
  tenant_id VARCHAR(255) NOT NULL,
  id VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  icon VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  "order" INTEGER NOT NULL,
  parent_id VARCHAR(255),
  i18n_key VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_menus_tenant_id ON menus(tenant_id);
CREATE INDEX IF NOT EXISTS idx_menus_parent_id ON menus(parent_id);

-- 添加RLS策略
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;

-- 创建策略：只允许访问自己租户的菜单
CREATE POLICY tenant_isolation_policy ON menus
  USING (tenant_id = current_setting('app.current_tenant_id', true)::VARCHAR);

-- 预置菜单数据
INSERT INTO menus (gid, tenant_id, id, name, icon, path, "order", parent_id, i18n_key)
VALUES
  -- 顶级菜单
  ('11111111-1111-1111-1111-111111111111', 'default', 'dashboard', '仪表盘', 'mdi-view-dashboard', '/dashboard', 1, NULL, 'menu.dashboard'),
  ('22222222-2222-2222-2222-222222222222', 'default', 'user-management', '用户管理', 'mdi-account-group', '/users', 2, NULL, 'menu.userManagement'),
  ('33333333-3333-3333-3333-333333333333', 'default', 'settings', '系统设置', 'mdi-cog', '/settings', 3, NULL, 'menu.settings'),
  ('44444444-4444-4444-4444-444444444444', 'default', 'menu-management', '菜单管理', 'mdi-menu', '/menus', 4, NULL, 'menu.menuManagement'),

  -- 子菜单
  ('55555555-5555-5555-5555-555555555555', 'default', 'user-list', '用户列表', 'mdi-account-multiple', '/users/list', 1, 'user-management', 'menu.userList'),
  ('66666666-6666-6666-6666-666666666666', 'default', 'user-roles', '角色管理', 'mdi-shield-account', '/users/roles', 2, 'user-management', 'menu.userRoles'),
  ('77777777-7777-7777-7777-777777777777', 'default', 'system-config', '系统配置', 'mdi-wrench', '/settings/config', 1, 'settings', 'menu.systemConfig')
ON CONFLICT (tenant_id, id) DO UPDATE
SET 
  name = EXCLUDED.name,
  icon = EXCLUDED.icon,
  path = EXCLUDED.path,
  "order" = EXCLUDED."order",
  parent_id = EXCLUDED.parent_id,
  i18n_key = EXCLUDED.i18n_key,
  updated_at = CURRENT_TIMESTAMP;

-- 创建触发器函数：自动更新updated_at字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ language 'plpgsql';

-- 创建触发器
DROP TRIGGER IF EXISTS update_menus_updated_at ON menus;
CREATE TRIGGER update_menus_updated_at
BEFORE UPDATE ON menus
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 创建设置租户ID的函数
CREATE OR REPLACE FUNCTION set_tenant_id(tenant_id VARCHAR)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_id, false);
END;
$$ LANGUAGE plpgsql;
