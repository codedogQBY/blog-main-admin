export const PERMISSIONS = {
  // 仪表盘权限
  DASHBOARD: {
    READ: 'dashboard.read',
  },

  // 用户管理权限
  USER: {
    READ: 'user.read',
    CREATE: 'user.create',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
  },

  // 角色管理权限
  ROLE: {
    READ: 'role.read',
    CREATE: 'role.create',
    UPDATE: 'role.update',
    DELETE: 'role.delete',
  },

  // 权限管理权限
  PERMISSION: {
    READ: 'permission.read',
    CREATE: 'permission.create',
    UPDATE: 'permission.update',
    DELETE: 'permission.delete',
    GROUP: {
      READ: 'permission.group.read',
      CREATE: 'permission.group.create',
      UPDATE: 'permission.group.update',
      DELETE: 'permission.group.delete',
    },
  },

  // 文章管理权限
  ARTICLE: {
    READ: 'article.read',
    CREATE: 'article.create',
    UPDATE: 'article.update',
    DELETE: 'article.delete',
    PUBLISH: 'article.publish',
    CATEGORY: {
      READ: 'article.category.read',
      CREATE: 'article.category.create',
      UPDATE: 'article.category.update',
      DELETE: 'article.category.delete',
    },
    TAG: {
      READ: 'article.tag.read',
      CREATE: 'article.tag.create',
      UPDATE: 'article.tag.update',
      DELETE: 'article.tag.delete',
    },
  },

  // 图库管理权限
  GALLERY: {
    READ: 'gallery.read',
    CREATE: 'gallery.create',
    UPDATE: 'gallery.update',
    DELETE: 'gallery.delete',
    PUBLISH: 'gallery.publish',
    CATEGORY: {
      READ: 'gallery.category.read',
      CREATE: 'gallery.category.create',
      UPDATE: 'gallery.category.update',
      DELETE: 'gallery.category.delete',
    },
  },

  // 留言管理权限
  STICKY_NOTE: {
    READ: 'sticky_note.read',
    CREATE: 'sticky_note.create',
    UPDATE: 'sticky_note.update',
    DELETE: 'sticky_note.delete',
    MODERATE: 'sticky_note.moderate',
  },

  // 随记管理权限
  DIARY: {
    READ: 'diary.read',
    CREATE: 'diary.create',
    UPDATE: 'diary.update',
    DELETE: 'diary.delete',
    SIGNATURE: {
      READ: 'diary.signature.read',
      CREATE: 'diary.signature.create',
      UPDATE: 'diary.signature.update',
      DELETE: 'diary.signature.delete',
    },
  },

  // 文件管理权限
  FILE: {
    READ: 'file.read',
    UPLOAD: 'file.upload',
    DELETE: 'file.delete',
  },

  // 关于页面管理权限
  ABOUT: {
    READ: 'about.read',
    UPDATE: 'about.update',
  },

  // 交互管理权限
  INTERACTION: {
    READ: 'interaction.read',
    DELETE: 'interaction.delete',
    MODERATE: 'interaction.moderate',
  },

  // 友链管理权限
  FRIEND_LINK: {
    READ: 'friend_link.read',
    CREATE: 'friend_link.create',
    UPDATE: 'friend_link.update',
    DELETE: 'friend_link.delete'
  },

  // 日志管理权限
  LOG: {
    READ: 'log.read',
    CREATE: 'log.create',
    DELETE: 'log.delete',
  },

  // 告警管理权限
  ALERT: {
    READ: 'alert.read',
    UPDATE: 'alert.update',
    DELETE: 'alert.delete',
  },

  // 性能分析权限
  PERFORMANCE: {
    READ: 'performance.read',
    DELETE: 'performance.delete',
  },

  // 双因素认证管理权限
  TWO_FACTOR: {
    READ: 'two_factor.read',
    CREATE: 'two_factor.create',
    UPDATE: 'two_factor.update',
    DELETE: 'two_factor.delete',
    BIND: 'two_factor.bind',
    UNBIND: 'two_factor.unbind',
    VERIFY: 'two_factor.verify',
    RECOVERY: 'two_factor.recovery',
    UNLOCK: 'two_factor.unlock',
    STATS: 'two_factor.stats',
  },

  // 系统配置权限
  SYSTEM: {
    CONFIG: {
      UPDATE: 'system.config.update',
    },
  },
} as const; 