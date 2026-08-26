import * as migration_20260826_090000_add_public_content from './20260826_090000_add_public_content'
import * as migration_20260826_150000_add_user_favorites from './20260826_150000_add_user_favorites'

export const migrations = [
  {
    up: migration_20260826_090000_add_public_content.up,
    down: migration_20260826_090000_add_public_content.down,
    name: '20260826_090000_add_public_content',
  },
  {
    up: migration_20260826_150000_add_user_favorites.up,
    down: migration_20260826_150000_add_user_favorites.down,
    name: '20260826_150000_add_user_favorites',
  },
]
